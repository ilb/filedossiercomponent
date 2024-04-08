import FormData from 'form-data';
import fetch from 'cross-fetch';
import createDebug from 'debug';

import { parseResponseTry, getContentType } from '../utils/response';

const debug = createDebug('filedossiercomponent');

export default class FileDossier {
  fetchOptions = {};
  basePath = '/workflow-web/web/v2';

  /**
   * @param fetchOptions - primary for server side requests auth - to pass `agent` to all fetch request options
   */
  constructor({ dossierParams, basePath, fetchOptions } = {}) {
    // if (!dossierParams || !dossierParams.dossierKey) { throw new Error('You must pass valid {dossierParams} to {FileDossier} constructor'); }
    this.dossierParams = dossierParams; // { dossierKey, dossierPackage, dossierCode, dossierMode };
    if (basePath) {
      this.basePath = basePath;
    }
    if (fetchOptions) {
      this.fetchOptions = fetchOptions;
    }
  }

  isBrowser = () => typeof window !== 'undefined';

  // Temporary solution
  // @TODO: remove hostnames from filedossier API
  replaceBasePath = (url) => {
    const parsed = new URL(url);
    debug('parsed url', { parsed });
    let result = `${this.basePath}/archive?url=${encodeURI(url)}`;
    const pathnameDossier = parsed.pathname.split('dossiers/')[1];
    if (pathnameDossier) {
      result = `${this.basePath}/dossiers/${pathnameDossier}${parsed.search}`;
    }
    debug('replaceBasePath', url, result);
    return result;
  };

  /**
   * Make fetch request and parse response
   * @return object { error, value, url }
   */
  makeRequest = async (url, option) => {
    let result = {};
    try {
      const response = await fetch(url, {
        credentials: 'same-origin', // IMPORTANT!!!!
        ...(this.fetchOptions || {}),
        ...(option || {}),
        headers: {
          accept: 'application/json',
          ...((this.fetchOptions && this.fetchOptions.headers) || {}),
          ...((option && option.headers) || {})
        }
      });
      const contentType = getContentType(response); // read it before bodyUsed
      result = await parseResponseTry(response);
      result.url = response.url; // there'll be redirect url
      result.contentType = contentType;
    } catch (e) {
      result.error = `FETCH ERROR: ${e && e.message}`;
    }
    return result;
  };

  getFileType = (file) => {
    if (file.mediaType) {
      if (file.mediaType.indexOf('image/') === 0) {
        return 'image';
      } else if (file.mediaType === 'application/pdf') {
        return 'pdf';
      }
    }
  };

  getFileAccept = (file) => {
    if (file && file.allowedMediaTypes) {
      return file.allowedMediaTypes.join(',');
    }
  };

  /** creates uniq string based on dossierFile and dossierParams */
  getFileUniqId = (file) => {
    const { dossierKey, dossierPackage, dossierCode } = this.dossierParams;
    return `file_${dossierKey}_${dossierPackage}_${dossierCode}_${file.code}`;
  };

  prepareDossier = (dossier) => {
    if (dossier.dossierFile && dossier.dossierFile.length) {
      dossier.dossierFile = dossier.dossierFile.map((file) => {
        const preparedFile = {
          ...file,
          type: this.getFileType(file),
          accept: this.getFileAccept(file),
          fileId: this.getFileUniqId(file),
          canSaveRotation: true
        };

        preparedFile.linksByRel = {};
        preparedFile.linksByRelExt = {};
        (file.link || []).forEach((link) => {
          preparedFile.linksByRel[link.rel] = link.href;
          preparedFile.linksByRelExt[link.rel] = this.replaceBasePath(link.href);
        });
        if (preparedFile.type === 'pdf' && preparedFile.linksByRel.container) {
          preparedFile.linksByRel.pdfContainer =
            preparedFile.linksByRel.container + '?path=index.json';
        }

        return preparedFile;
      });
    }
    return dossier;
  };

  getFileTypeByExt = (ext) => {
    if (ext) {
      if (['jpeg', 'jpg', 'jpe', 'png'].indexOf(ext.toLowerCase()) !== -1) {
        return 'image';
      } else if (ext === 'pdf') {
        return 'pdf';
      }
    }
  };

  parseExternalFile = (url, file) => {
    const externalFile = {
      ...file,
      type: this.getFileTypeByExt(file.ext),
      fileId: file.name,
      linksByRel: {
        attachment: file.path + '&contentDisposition=attachment',
        inline: file.path + '&contentDisposition=inline'
      },
      lastModified: file.lastModified,
      external: true
    };

    if (externalFile.type === 'pdf') {
      externalFile.linksByRel.container = `${url}/${encodeURIComponent(file.name)}`;
      externalFile.linksByRel.pdfContainer = `${url}/${encodeURIComponent(file.name)}/index.json`;
    }

    return externalFile;
  };

  /**
   * Получение данных досье
   * @param callback - optional function to set state
   */
  getDossier = async ({ callback } = {}) => {
    if (callback) {
      callback({ loading: true, error: null, externalError: null });
    }
    const dossierParams = { ...this.dossierParams };
    const { dossierKey, dossierPackage, dossierCode, dossierMode, externalDossier } = dossierParams;
    const url = `${this.basePath}/dossiers/${dossierKey}/${dossierPackage}/${dossierCode}/${dossierMode}`;
    var { value: dossier, error } = await this.makeRequest(url);

    if (dossier) {
      dossier = this.prepareDossier(dossier);
    }

    const result = {
      loading: false,
      external: null,
      dossierParams,
      dossier,
      error
    };

    if (!error && externalDossier) {
      result.external = await this.getExternalDossier(externalDossier);
    }

    if (callback) {
      callback(result);
    }
    return result;
  };

  getExternalDossier = async (externalDossierUrl) => {
    const url = `${this.basePath}/containers?uri=${encodeURIComponent(externalDossierUrl)}`;
    const result = await this.makeRequest(url);
    if (result.value && result.value.length) {
      result.value = result.value.map(this.parseExternalFile.bind(null, result.url));
    }
    return result;
  };

  /* get file container */
  getContainer = async (file) => {
    const url = file.linksByRel.pdfContainer;
    if (!url) {
      return { error: 'Не найден url контейнера' };
    }
    const result = await this.makeRequest(this.replaceBasePath(url));
    return result;
  };

  /* get external file container */
  getExternalContainer = async (file) => {
    const url = file.path;
    if (!url) {
      return { error: 'Не найден url контейнера' };
    }
    const result = await this.makeRequest(this.replaceBasePath(url));
    return result;
  };

  /* Сохранение угла поворота файла */
  saveFileRotation = async ({ dossierFile, angle }) => {
    if (dossierFile.canSaveRotation) {
      await new Promise((resolve) => setTimeout(resolve, 100, angle)); // TODO это заглушка, убрать
    }
  };

  /** Загрyзка файла
   * @param {object} dossierFile - dossier file
   * @param {File} file - a file to upload
   * @param {array{File}} files - array of files to upload (and merge)
   * @param {bolean} update - if true file will be merged with existed
   */
  uploadFile = async ({ dossierFile, file, files, update, fileCode }) => {
    if (!dossierFile) {
      throw new Error('`dossierFile` is required to `uploadFile`');
    }
    if (fileCode) {
      throw new Error(
        '`uploadFile` by `fileCode` is deprecated, you need to pass entire `dossierFile` to this method'
      );
    }
    const filesToUpload = files || (file && [file]);
    if (!filesToUpload || !filesToUpload.length) {
      return { error: 'Не переданы файлы для загрузки' };
    }

    const url = dossierFile.linksByRel[update ? 'update' : 'publish'];
    const formData = new FormData();
    [].forEach.call(filesToUpload, (f, i) => {
      formData.append(`file_${i}`, f);
    });

    const result = await this.makeRequest(this.replaceBasePath(url), {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        accept: '*/*'
      },
      body: formData
    });
    return result;
  };

  /** Возвращает контекст файла */
  getContext = async ({ dossierFile, fileCode }) => {
    if (!dossierFile) {
      throw new Error('`dossierFile` is required to `getContext`');
    }
    if (fileCode) {
      throw new Error(
        '`getContext` by `fileCode` is deprecated, you need to pass entire `dossierFile` to this method'
      );
    }
    const url = dossierFile.linksByRel.context;
    if (!url) {
      return { error: 'Не найден url контекста' };
    }
    const result = await this.makeRequest(this.replaceBasePath(url));
    return result;
  };

  /* Изменяет контекст файла */
  setContext = async ({ dossierFile, context, fileCode }) => {
    if (!dossierFile) {
      throw new Error('`dossierFile` is required to `setContext`');
    }
    if (fileCode) {
      throw new Error(
        '`setContext` by `fileCode` is deprecated, you need to pass entire `dossierFile` to this method'
      );
    }
    const url = dossierFile.linksByRel.context;
    if (!url) {
      return { error: 'Не найден url контекста' };
    }
    let body = context || '{}';
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }
    const result = await this.makeRequest(this.replaceBasePath(url), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*' // TODO так прописано в api, убрать, если всегда json
      },
      body
    });
    return result;
  };

  /* import file/files from url/urls */
  importFile = async ({ dossierFile, url, urls, update, fileCode }) => {
    if (!dossierFile) {
      throw new Error('`dossierFile` is required to `importFile`');
    }
    if (fileCode) {
      throw new Error(
        '`importFile` by `fileCode` is deprecated, you need to pass entire `dossierFile` to this method'
      );
    }
    const fileUrls = urls || (url && [url]);
    if (!fileUrls || !fileUrls.length) {
      return { error: 'Не переданы файлы для загрузки' };
    }

    const files = [];
    for (let i = 0; i < fileUrls.length; i++) {
      /* load all files as array buffer */
      const fileUrl = encodeURI(fileUrls[i]);
      const fileResult = await this.makeRequest(this.replaceBasePath(fileUrl), {
        headers: { accept: '*/*' }
      });
      if (fileResult.error || !fileResult.value) {
        return fileResult; // stop if any errors or empty file
      } else {
        let file;
        if (this.isBrowser()) {
          file = new Blob([fileResult.value], {
            type: fileResult.contentType || 'application/octet-stream'
          });
        } else {
          // было: Buffer.from(fileResult.value), при этом получался странный баг escheck в bailverificationv2
          file = fileResult.value;
        }

        files.push(file);
      }
    }

    const uploadResult = await this.uploadFile({ dossierFile, files, update });
    return uploadResult;
  };

  /**
   * Создает асинхронный метод-обертку для вызова сервисов с последующим обновлением данных стейта (loading и error)
   * @param {object} state - optional state object to merge with new state
   * @param {function} setState - function to update state
   * @param {function} action - async function with some request action
   * @param {boolean} withUpdate - flag of necessity to call getDossier after action
   */
  createAction =
    ({ state = {}, setState, action, callback, description }) =>
      async (...params) => {
        setState({ ...state, loading: true, error: null, description });
        const result = await action(...params);
        if (result && result.error) {
          setState({ ...state, loading: false, error: result.error, description });
          return result;
        }

        if (callback) {
          await callback();
        }

        setState({ ...state, loading: false, error: null, value: null, ...result, description });
        return result;
      };
}
