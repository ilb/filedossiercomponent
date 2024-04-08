import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { List } from 'semantic-ui-react';
import FileContentExternal from '../DossierViewer/FileContentExternal';


export default function ExternalFilesList({ basePath, files }) {
  if (!files || !files.length) {
    return null;
  }
  const [selectedFile, selectFile] = useState(files[0]);

  const thumbnailSizes = {
    width: 120,
    height: 170
  };

  const renderFileThumbnail = (externalFile) => {
    return (
      <List.Item
        key={externalFile.path}
        style={{ display: 'inline-block' }}
        active={externalFile.path === selectedFile.path}
        onClick={() => {
          selectFile(externalFile);
        }}>
        <FileContentExternal
          basePath={basePath}
          file={externalFile}
          mode="thumbnail"
          sizes={thumbnailSizes}
        />
        <div
          className="external-thumbnail-file-name"
          style={{ width: `${thumbnailSizes.width}px` }}>
          {externalFile.name}
        </div>
      </List.Item>
    );
  };

  return (
    <div className="compact-external-files-list" style={{ width: '100%', height: '100%' }}>
      <div
        className="external-sidebar"
        style={{
          height: '100%',
          width: `${thumbnailSizes.width + 46}px`,
          marginLeft: `-${thumbnailSizes.width + 46}px`
        }}>
        <List
          selection
          style={{ height: '100%', overflow: 'auto', padding: '1rem' }}
          className="external-dossier-files-list">
          {files.map(renderFileThumbnail)}
        </List>
        <div className="external-sidebar-label">
          Файлы: {files.findIndex((f) => f.path === selectedFile.path) + 1} / {files.length}
        </div>
      </div>
      {selectedFile && <FileContentExternal basePath={basePath} file={selectedFile} />}
    </div>
  );
}

ExternalFilesList.propTypes = {
  files: PropTypes.array.isRequired,
  basePath: PropTypes.string
};
