import React, { useState } from 'react';
import { Divider, Grid, GridColumn, Header, Icon, Menu, Segment } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import UploadForm from '../UploadForm';
import ExternalDossier from '../ExternalDossier';
import FileContent from '../DossierViewer/FileContent';
import { useDropzone } from 'react-dropzone';

export default function DossierTabs({
  dossierFiles,
  external,
  actionsState,
  dossierActions,
  readOnly
}) {
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [selectedFileCode, selectFile] = useState(dossierFiles[0].code);
  const selectedFile =
    selectedFileCode && dossierFiles.find((file) => file.code === selectedFileCode);

  const onTabChange = (e, { name }) => {
    selectFile(name);
  };

  const updateDropzone = useDropzone({
    accept: selectedFile.allowedMediaTypes,
    onDrop: async (acceptedFiles) => {
      setDroppedFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        )
      );
      await dossierActions.uploadFile({
        dossierFile: selectedFile,
        files: acceptedFiles,
        update: true
      });
    }
  });

  const replaceDropzone = useDropzone({
    accept: selectedFile.allowedMediaTypes,
    onDrop: async (acceptedFiles) => {
      setDroppedFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        )
      );
      await dossierActions.uploadFile({
        dossierFile: selectedFile,
        files: acceptedFiles
      });
    }
  });

  return (
    <React.Fragment>
      <Grid reversed='computer vertically'>
        <Grid.Row>
          
            <div style={{ marginBottom: 16 }}>
              <Header>Досье</Header>
              <p>
                Нажмите "Добавить файл", чтобы добавить новые страницы/документы, либо "Заменить
                файл", чтобы загрузить новую версию документа.
              </p>
            </div>
            {dossierFiles.length > 0 && (
              <Menu fluid pointing vertical>
                {dossierFiles.map((df) => {
                  return (
                    <Menu.Item
                      key={df.code}
                      name={df.code}
                      active={df.code === selectedFileCode}
                      onClick={onTabChange}>
                      <div>{df.name}</div>
                      {df.code === selectedFileCode && !df.readonly && (
                        <Segment.Group
                          horizontal
                          style={{
                            border: '1px',
                            borderStyle: 'dashed'
                          }}>
                          <Segment
                            textAlign="center"
                            style={{
                              minHeight: 0
                            }}>
                            <div {...updateDropzone.getRootProps({ className: 'updateDropzone' })}>
                              <div style={{ opacity: 0.7, marginBottom: 8 }}>Добавить файл</div>
                              <div style={{ opacity: 0.3 }}>Нажмите или перетащите</div>
                              <input {...updateDropzone.getInputProps()} />
                            </div>
                          </Segment>
                          <Segment
                            textAlign="center"
                            style={{
                              minHeight: 0
                            }}>
                            <div
                              {...replaceDropzone.getRootProps({ className: 'replaceDropzone' })}>
                              <div style={{ opacity: 0.7, marginBottom: 8 }}>Заменить файл</div>
                              <div style={{ opacity: 0.3 }}>Нажмите или перетащите</div>{' '}
                              <input {...replaceDropzone.getInputProps()} />
                            </div>
                          </Segment>
                        </Segment.Group>
                      )}
                    </Menu.Item>
                  );
                })}
              </Menu>
            )}

            <Segment>
              {selectedFile && selectedFile.exists && (
                <div style={{ flex: '1 1 auto', height: '90vh' }}>
                  {' '}
                  {/* min-height 100px */}
                  <FileContent file={selectedFile} />
                </div>
              )}
            </Segment>
        </Grid.Row>
      </Grid>
    </React.Fragment>
  );
}

DossierTabs.propTypes = {
  dossierFiles: PropTypes.array.isRequired,
  external: PropTypes.object,
  actionsState: PropTypes.object.isRequired,
  dossierActions: PropTypes.object.isRequired,
  readOnly: PropTypes.bool
};
