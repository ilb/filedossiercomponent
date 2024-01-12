import React, { useEffect, useState } from 'react';
import { Select } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import UploadForm from '../UploadForm';
import ExternalDossier from '../ExternalDossier';
import FileContent from './FileContent';

export default function DossierViewer({
  basePath,
  dossierFiles,
  external,
  actionsState,
  dossierActions,
  readOnly
}) {
  const [selectedFileCode, selectFile] = useState(dossierFiles[0].code);
  const selectedFile =
    selectedFileCode && dossierFiles.find((file) => file.code === selectedFileCode);

  useEffect(() => {
    !selectedFile && selectFile(dossierFiles[0].code);
  }, [selectedFile]);

  return (
    <React.Fragment>
      <div>
        {dossierFiles.length > 1 && (
          <Select
            compact
            fluid
            style={{ zIndex: 1010, marginBottom: '0.5rem' }}
            value={selectedFileCode}
            text={selectedFile.name}
            onChange={(event, { value }) => {
              selectFile(value);
            }}
            options={dossierFiles.map((file) => ({
              key: file.code,
              value: file.code,
              content: file.name
            }))}
            selectOnNavigation={false}
            selectOnBlur={false}
          />
        )}

        {selectedFile && !(selectedFile.readonly || readOnly) && (
          <div style={{ marginBottom: '0.5rem' }}>
            {external ? (
              <ExternalDossier
                file={selectedFile}
                external={external}
                actionsState={actionsState}
                dossierActions={dossierActions}
              />
            ) : (
              <UploadForm
                file={selectedFile}
                actionsState={actionsState}
                dossierActions={dossierActions}
              />
            )}
          </div>
        )}
      </div>

      {selectedFile && selectedFile.exists && (
        <div style={{ flex: '1 1 auto', height: '100px' }}>
          {' '}
          {/* min-height 100px */}
          <FileContent basePath={basePath} file={selectedFile} />
        </div>
      )}
    </React.Fragment>
  );
}

DossierViewer.propTypes = {
  dossierFiles: PropTypes.array.isRequired,
  external: PropTypes.object,
  actionsState: PropTypes.object.isRequired,
  dossierActions: PropTypes.object.isRequired,
  readOnly: PropTypes.bool
};
