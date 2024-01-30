import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'semantic-ui-react';

function DossierInfo({ file }) {
  return (
    <React.Fragment>
      <Menu.Item>Имя файла: {file.name}</Menu.Item>
      {file.lastModified && <Menu.Item>Загружен: {file.lastModified}</Menu.Item>}
      {file.linksByRel && file.linksByRel?.attachment && (
        <Menu.Item
          as="a"
          content="Скачать"
          icon="download"
          href={file.linksByRelExt?.attachment}
          target="_blank"
        />
      )}
    </React.Fragment>
  );
}

DossierInfo.propTypes = {
  file: PropTypes.object.isRequired
};

export default DossierInfo;
