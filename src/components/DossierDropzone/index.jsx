import React from 'react';
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';
import { Segment, Image, Icon, Label } from 'semantic-ui-react';

const DossierDropzone = ({ dossierFiles, external, actionsState, dossierActions, readOnly }) => {
  const [files, setFiles] = useState([]);
  const selectedFile = dossierFiles[0];

  const { getRootProps, getInputProps } = useDropzone({
    accept: selectedFile.allowedMediaTypes,
    onDrop: async (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        )
      );
      const result = await dossierActions.uploadFile({
        dossierFile: selectedFile,
        files: acceptedFiles
      });
      console.log(result);
    }
  });

  const thumbs = files.map((file) => (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: 2,
        border: '1px solid #eaeaea',
        marginBottom: 8,
        marginRight: 8,
        width: 100,
        height: 150,
        padding: 2,
        boxSizing: 'border-box'
      }}
      key={file.name}>
      <Image
        size="small"
        style={{
          display: 'flex',
          minWidth: 0,
          overflow: 'hidden'
        }}
        src={file.preview}
      />
      <Label attached="top right">{selectedFile.name}</Label>
      {!actionsState.error && <Icon color="green" name="check circle" />}
    </div>
  ));

  return (
    <React.Fragment>
      <div {...getRootProps({ className: 'dropzone' })}>
        <Segment
          placeholder
          textAlign="center"
          style={{
            minHeight: 200,
            padding: 12,
            marginBottom: 0,
            border: `primary 2px`
          }}>
          <div
            style={{
              display: 'center',
              marginTop: 16
            }}>
            {thumbs}
          </div>
          {!files.length && (
            <div style={{ opacity: 0.8, marginBottom: 8 }}>
              Перетащите документ или нажмите чтобы выбрать файл
            </div>
          )}
          <input {...getInputProps()} />
        </Segment>
      </div>
    </React.Fragment>
  );
};

export default DossierDropzone;
