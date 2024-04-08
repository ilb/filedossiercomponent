import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Segment, Message, Menu } from 'semantic-ui-react';
import Thumbnail from './Thumbnail';
import ImagesViewer from './ImagesViewer';
import DossierInfo from './ImagesViewer/DossierInfo';
import FileDossier from '../../classes/FileDossier';

export default function FileContentExternal({ basePath, file, mode, sizes }) {
  const dossierInst = new FileDossier({ basePath });
  // Стейт для данных о контейнере файла
  const [containerState, setContainerState] = useState({
    loading: false,
    error: null,
    value: null
  });
  const getContainer = dossierInst.createAction({
    description: 'Загрузка контейнера файла',
    state: containerState,
    setState: setContainerState,
    action: dossierInst.getExternalContainer
  });

  const createErrorMessage = ({ header, content, warning, attached }) => {
    // eslint-disable-line react/prop-types
    const thumbnailErrorStyle = { margin: 0, position: 'absolute', top: 0, left: 0, right: 0 };
    return (
      <Message
        error={!warning}
        warning={warning}
        header={mode === 'thumbnail' ? 'Ошибка' : header}
        content={mode === 'thumbnail' ? undefined : content}
        style={mode === 'thumbnail' ? thumbnailErrorStyle : undefined}
        attached={attached}
        title={`${header}. ${content || ''}`}
      />
    );
  };

  // У выбранного файла нужно загрузить контейнер
  const hasContainer = file && file.linksByRel.pdfContainer;
  const canDisplayFile = hasContainer || file.type === 'image';

  useEffect(() => {
    if (hasContainer) {
      getContainer(file);
    } else {
      setContainerState({ loading: false, error: null, value: null }); // reset
    }
  }, [file.fileId, file.lastModified]);

  // add `_nocache` query param to image src = `lastModified`
  const makeImageSrcUniq = ({ src, lastModified }) => {
    const separator = src.indexOf('?') !== -1 ? '&' : '?';
    return `${src}${separator}_nocache=${(lastModified || '').replace(/\D/g, '')}`;
  };

  let images;
  if (canDisplayFile) {
    if (file.type === 'image') {
      images = [
        {
          lastModified: file.lastModified,
          name: file.name,
          src: makeImageSrcUniq({
            src: dossierInst.replaceBasePath(file.linksByRel.inline),
            lastModified: file.lastModified
          })
        }
      ];
    } else {
      if (hasContainer && containerState.value && containerState.url) {
        images = containerState.value.map((img) => ({
          ...img,
          src: makeImageSrcUniq({
            src: `${containerState.url
              .replace(/index\.json/, '')
              .replace(/\/$/, '')}/${encodeURIComponent(img.name)}`,
            lastModified: file.lastModified
          })
        }));
        console.log(images);
      }
    }
  }

  let ImagesComponent;
  switch (mode) {
    case 'thumbnail':
      ImagesComponent = Thumbnail;
      break;
    default:
      ImagesComponent = ImagesViewer;
  }
  const contentRef = useRef(null);

  return (
    <Segment
      basic
      loading={containerState.loading}
      className="file-dossier-file-content"
      style={{
        position: 'relative',
        width: '100%',
        padding: 0,
        margin: 0,
        minHeight: '46px'
      }}>
      {canDisplayFile && images && images.length > 0 && (
        <ImagesComponent
          file={file}
          images={images}
          dossierInst={dossierInst}
          contentRef={contentRef}
          sizes={sizes}
        />
      )}
      {canDisplayFile &&
        images &&
        images.length === 0 &&
        createErrorMessage({
          warning: true,
          header: `Не найдены изображения в контейнере`,
          attached: mode !== 'thumbnail' ? 'top' : undefined
        })}
      {!canDisplayFile &&
        createErrorMessage({
          header: `Невозможно отобразить файл: ${file.name}`,
          attached: mode !== 'thumbnail' ? 'top' : undefined
        })}
      {!!containerState.error &&
        createErrorMessage({
          header: 'Ошибка при загрузке контейнера',
          content: containerState.error,
          attached: mode !== 'thumbnail' ? 'top' : undefined
        })}
      {(!canDisplayFile || !!containerState.error || (images && images.length === 0)) &&
        mode !== 'thumbnail' && (
          <Menu vertical attached="bottom" style={{ width: 'auto' }}>
            <DossierInfo file={file} />
          </Menu>
        )}
    </Segment>
  );
}

FileContentExternal.propTypes = {
  file: PropTypes.object.isRequired,
  mode: PropTypes.string,
  sizes: PropTypes.object
};
