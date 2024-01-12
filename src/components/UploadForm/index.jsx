import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown, Radio, Input, Grid } from 'semantic-ui-react';
import PrivAPI from './PrivAPI';

const makeRainbow = (text) => {
  const colors = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'navy'];
  return (text || '').split('').map((char, index) => (
    <span
      key={index}
      style={{ color: colors[index % colors.length], textShadow: '1px 1px 0 black' }}>
      {char}
    </span>
  ));
};

export default function UploadForm({ file, actionsState, dossierActions, uploadCallback }) {
  const { fileId, accept, allowedMultiple } = file;
  const { loading } = actionsState;
  const [state, _setState] = useState({ scanColor: 'color', scanDpi: '150', uploadMode: 'new' });
  const setState = (newState) => _setState({ ...state, ...newState });
  const { fileName, fileTitle, scanColor, scanDpi, uploadMode } = state;

  const changeField = (e, { name, value }) => {
    setState({ [name]: value });
  };

  const selectFile = (event) => {
    const files = event.target.files;
    let fileName, fileTitle;
    if (files && files.length) {
      fileName = files.length === 1 ? files[0].name : `Выбрано файлов: ${files.length}`;
      fileTitle = Array.from(files)
        .map((file) => file.name)
        .join(' \n');
    }
    setState({ fileName, fileTitle });
  };

  const scanStart = (e) => {
    e.preventDefault();
    if (!window.privilegedAPI) {
      alert('privilegedAPI.call failed');
      return;
    }

    const fileid = `bystroscan_${fileId}`; // probably file name
    const fileinputid = fileId; // id of input type=file
    const color = scanColor === 'bw' ? 'bw' : 'color';
    const dpi = Number(scanDpi) > 70 ? Number(scanDpi) : 70;

    PrivAPI.scanStart({
      fileid,
      fileinputid,
      color,
      dpi,
      onscanfinish: scanFinish
    });
  };

  const scanFinish = (data) => {
    const fileName = data.value || null;
    setState({ fileName, fileTitle: fileName });
  };

  const uploadFile = async () => {
    const fileInput = document.querySelector(`#${fileId}`);
    if (!fileInput) {
      alert(`Не найден input с id=${fileId}`);
      return;
    }

    const files = fileName && fileInput.files;
    const result = await dossierActions.uploadFile({
      dossierFile: file,
      files,
      update: uploadMode === 'merge'
    });

    // reset file input
    if (!result.error) {
      fileInput.value = '';
      setState({ fileName: null, fileTitle: null });
    }

    if (uploadCallback) {
      uploadCallback(result);
    }
  };

  return (
    <div style={{ display: 'flex', flexFlow: 'row wrap', padding: '0 1px' }}>
      <div>
        <Button
          type="button"
          basic
          attached="left"
          content="БыстроСкан"
          onClick={scanStart}
          disabled={loading}
        />
        <Dropdown simple basic icon="setting" open={false} className="right attached button icon">
          <Dropdown.Menu
            className="file-dossier-bystroscan-params"
            style={{ zIndex: 1001, padding: '0.5rem' }}>
            <div>
              <Radio
                name="scanColor"
                value="color"
                label={makeRainbow('цветное')}
                checked={scanColor === 'color'}
                onChange={changeField}
                style={{ marginRight: '0.5rem' }}
              />
              <Radio
                name="scanColor"
                value="bw"
                label="ч/б"
                checked={scanColor === 'bw'}
                onChange={changeField}
              />
            </div>
            <div>
              <label>Разрешение</label>
              <Input
                title="Разрешение"
                type="text"
                name="scanDpi"
                maxLength="3"
                size="mini"
                value={scanDpi}
                onChange={changeField}
                style={{ width: '3rem', margin: '0 0.25rem', textAlign: 'center' }}
              />
              <label>dpi</label>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <Button
        as="div"
        basic
        className="file-dossier-file-button"
        disabled={loading}
        title={fileTitle}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '13rem',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          margin: '0 0.5rem',
          verticalAlign: 'top'
        }}>
        <span>{fileName || 'Выбрать файл'}</span>
        <input
          type="file"
          id={fileId}
          accept={accept}
          multiple={allowedMultiple}
          onChange={selectFile}
          disabled={loading}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            minWidth: '100%',
            minHeight: '100%',
            opacity: 0,
            outline: 'none',
            cursor: 'inherit',
            display: 'block',
            padding: 0
          }}
        />
      </Button>
      <div>
        <Button
          type="button"
          color="green"
          attached="left"
          content="Загрузить"
          onClick={uploadFile}
          loading={loading}
          disabled={loading}
        />
        <Dropdown
          text=" "
          // className="right attached button green icon"
          className="right attached button green icon file-dossier-upload-mode-selection"
          icon={`${uploadMode === 'merge' ? 'copy' : 'file'} outline`}
          onChange={(e, { value }) => {
            setState({ uploadMode: value });
          }}
          value={uploadMode}
          options={[
            { key: 'new', text: 'Загрузить новый файл', value: 'new', icon: 'file outline' },
            { key: 'merge', text: 'Объединить файлы', value: 'merge', icon: 'copy outline' }
          ]}
        />
      </div>
    </div>
  );
}

UploadForm.propTypes = {
  file: PropTypes.object.isRequired,
  actionsState: PropTypes.object.isRequired,
  dossierActions: PropTypes.object.isRequired,
  uploadCallback: PropTypes.func
};
