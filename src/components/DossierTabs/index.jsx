import React, { useEffect, useState } from 'react';
import { Grid, Header, Icon, Label, Menu, Segment, Transition } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import FileContent from '../DossierViewer/FileContent';
import { useDropzone } from 'react-dropzone';

export default function DossierTabs({
  basePath,
  dossierFiles,
  actionsState,
  dossierActions,
  onUploadHandler
}) {
  const [selectedFileCode, selectFile] = useState(dossierFiles[0].code);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const selectedFile =
    selectedFileCode && dossierFiles.find((file) => file.code === selectedFileCode);

  const onTabChange = (e, { name }) => {
    setFilesUploaded(false);
    selectFile(name);
  };

  const updateDropzone = useDropzone({
    accept: selectedFile.allowedMediaTypes,
    onDrop: async (acceptedFiles) => {
      await dossierActions.uploadFile({
        dossierFile: selectedFile,
        files: acceptedFiles,
        update: true
      });
      setFilesUploaded(true);

      setTimeout(() => {
        setFilesUploaded(false);
      }, 3000);

      onUploadHandler && onUploadHandler(selectedFile);
    }
  });

  const replaceDropzone = useDropzone({
    accept: selectedFile.allowedMediaTypes,
    onDrop: async (acceptedFiles) => {
      await dossierActions.uploadFile({
        dossierFile: selectedFile,
        files: acceptedFiles
      });
      setFilesUploaded(true);

      setTimeout(() => {
        setFilesUploaded(false);
      }, 3000);

      onUploadHandler && onUploadHandler(selectedFile);
    }
  });

  return (
    <React.Fragment>
      <Grid>
        <Grid.Column>
          <div style={{ marginBottom: 16 }}>
            <Header>Досье</Header>
            <p>
              Нажмите "Добавить файл", чтобы добавить новые страницы/документы, либо "Заменить
              файл", чтобы загрузить новую версию документа.
            </p>
          </div>
          {dossierFiles.length > 0 && (
            <Menu fluid vertical>
              {dossierFiles.map((df) => {
                return (
                  <Menu.Item
                    key={df.code}
                    name={df.code}
                    active={df.code === selectedFileCode}
                    onClick={onTabChange}>
                    <div>
                      {df.name}
                      <Transition
                        visible={df.code === selectedFile.code && df.exists && filesUploaded}
                        animation="scale"
                        duration={500}>
                        <Label attached="top right">
                          <Icon name="check circle" color="green" loading={actionsState.loading} />
                          Файл загружен
                        </Label>
                      </Transition>
                    </div>
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
                          <div {...replaceDropzone.getRootProps({ className: 'replaceDropzone' })}>
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

          <Segment
            piled
            style={{
              height: '90vh',
              width: 'auto',
              marginTop: 16,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
            {selectedFile && selectedFile.exists && (
              <FileContent basePath={basePath} file={selectedFile} />
            )}
          </Segment>
        </Grid.Column>
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
