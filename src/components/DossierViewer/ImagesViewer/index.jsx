import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ControlsMenu, { getZoomOutScale, getZoomInScale, calcScaleNum } from './ControlsMenu';
import { useDebouncedCallback } from "use-debounce";

export default function ImagesViewer({ file, images, dossierInst, contentRef }) {
  const initialState = {
    currentPage: 1,
    pageText: 1,
    rotateLoading: null,
    scaleValue: 'pageWidthOption',
    scaleNum: 1
  };
  const [state, _setState] = useState(initialState);
  const [rotateArr, setRotateArr] = useState(new Array(images.length));
  const stateRef = useRef(state); // for event listeners to always get actual state
  const setState = (updates, cb) => {
    _setState((currentState) => {
      const newState = { ...currentState, ...updates }; // merge updates with previous state
      stateRef.current = newState; // keep actual state in ref
      if (cb && typeof cb === 'function') {
        cb(newState);
      }
      return newState;
    });
  };

  /* mounted */
  useEffect(() => {
    const imgContainer = contentRef.current;
    window.removeEventListener('scroll', scrollUpdated, true);
    imgContainer.removeEventListener('DOMMouseScroll', onMouseScrollHandler, false);

    window.addEventListener('scroll', scrollUpdated, true);
    imgContainer.onmousedown = dragToScroll;
    imgContainer.addEventListener('DOMMouseScroll', onMouseScrollHandler, false);
    imgContainer.onmousewheel = onMouseScrollHandler;

    return function cleanup() {
      window.removeEventListener('scroll', scrollUpdated, true);
      imgContainer.removeEventListener('DOMMouseScroll', onMouseScrollHandler, false);
    };
  });

  /* file changed */
  useEffect(() => {
    resetContainerScroll();
    setState({ ...initialState }); // reset state
  }, [file.fileId, file.lastModified]);

  const resetContainerScroll = () => {
    const imgContainer = contentRef.current;
    if (imgContainer) {
      imgContainer.scrollTop = imgContainer.scrollLeft = 0;
    }
  };

  const onMouseScrollHandler = function (e) {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      const { scaleNum } = stateRef.current;
      if (scaleNum) {
        const newScaleNum =
          (e.deltaY || e.detail) > 0 ? getZoomOutScale(scaleNum) : getZoomInScale(scaleNum);
        setScale(newScaleNum);
      }
    }
  };

  const scrollUpdated = useDebouncedCallback(() => {
    const imgContainer = contentRef.current;
    const viewTop = imgContainer.scrollTop;
    const viewBottom = viewTop + window.innerHeight;

    // find visible pages (images)
    const imgs = imgContainer.querySelectorAll('img');
    const visiblePages = [];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.intersectionRatio > 0) {
          const imgHeight = entry.target.clientHeight;
          const visibleHeight = Math.min(entry.boundingClientRect.bottom, viewBottom) - Math.max(entry.boundingClientRect.top, viewTop);
          const percent = ((visibleHeight * 100) / imgHeight) | 0;

          visiblePages.push({
            pageNum: i + 1,
            percent
          });

          if (!visiblePages.length) {
            return;
          }
          // calc current page num
          let newPageNum = visiblePages[0].pageNum;
          if (visiblePages[1] && visiblePages[1].percent > visiblePages[0].percent) {
            newPageNum++;
          }

          const { currentPage } = stateRef.current;
          if (newPageNum !== currentPage) {
            setState({ currentPage: newPageNum, pageText: newPageNum }); // page changed
          }

          if (visiblePages.length > 1) {
            // find the image with the largest visible percentage
            const maxVisibleImg = visiblePages.reduce((a, b) => a.percent > b.percent ? a : b);
            const newPageNum = maxVisibleImg.pageNum;

            const { currentPage } = stateRef.current;
            if (newPageNum !== currentPage) {
              setState({ currentPage: newPageNum, pageText: newPageNum }); // page changed
            }
          }
        }
      });
    });

    imgs.forEach((img) => {
      observer.observe(img);
    });
  }, 300);


  const dragToScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (document.activeElement) {
      document.activeElement.blur();
    }
    const container = e.currentTarget;
    const startScrollTop = container.scrollTop || 0;
    const startscrollLeft = container.scrollLeft || 0;
    const startX = e.pageX;
    const startY = e.pageY;
    const target = e.currentTarget;
    target.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';

    document.onmousemove = (e) => {
      container.scrollTop = startScrollTop + startY - e.pageY;
      container.scrollLeft = startscrollLeft + startX - e.pageX;
    };

    document.onmouseup = () => {
      target.style.cursor = '';
      document.body.style.cursor = '';
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  const setPage = (event, { value }) => {
    const pageNum = Number(value);
    if (!pageNum || pageNum > images.length) {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    } else {
      const imgContainer = contentRef.current;
      const imgs = imgContainer.querySelectorAll('img');
      if (imgs[pageNum - 1]) {
        imgs[pageNum - 1].scrollIntoView({ block: 'start' });
        setState({ currentPage: pageNum, pageText: pageNum });
      }
    }
  };

  const setPageText = (value) => {
    setState({ pageText: value });
  };

  const setScale = (scale) => {
    const imgContainer = contentRef.current;
    const imgs = imgContainer.querySelectorAll('img');
    const containersItems = imgContainer.querySelectorAll('div');
    [].forEach.call(imgs, (img, i) => {
      setScalePerImg({ img, scale, rotate: rotateArr[i], container: containersItems[i] });
    });
  };

  const setScalePerImg = ({ img, scale, rotate, container }) => {
    const currentScaleNum = state.scaleNum;
    const imgContainer = contentRef.current;
    const { width, height } = window.getComputedStyle(imgContainer);
    const containerSizes = { width: parseFloat(width), height: parseFloat(height) };
    const elementSizes = { width: img.naturalWidth, height: img.naturalHeight };
    const newScaleNum = calcScaleNum({
      currentScaleNum,
      scale,
      rotate,
      containerSizes,
      elementSizes,
      numPages: images.length
    });

    const newWidth = img.naturalWidth * newScaleNum;
    const newHeight = img.naturalHeight * newScaleNum;

    img.style.width = `${newWidth}px`;
    img.style.minWidth = `${newWidth}px`;
    img.style.maxWidth = `${newWidth}px`;
    img.style.height = `${newHeight}px`;
    img.style.minHeight = `${newHeight}px`;
    img.style.transform = `rotate(${rotate}deg`;
    img.style.border = '1px';
    imgContainer.style.overflow = 'auto';

    if (container) {
      if (rotate % 180 !== 0) {
        // 90 or 270
        const marginOffset = (newWidth - newHeight) / 2;
        img.style.left = `${-marginOffset}px`;
        img.style.top = `${marginOffset}px`;
        container.style.height = `${newWidth}px`;
        container.style.minHeight = `${newWidth}px`;
      } else {
        img.style.left = ``;
        img.style.top = ``;
        img.style.margin = ``;
        container.style.height = `${newHeight}px`;
        container.style.minHeight = `${newHeight}px`;
      }
    }

    // All images might have different sizes, but we must save current scale, so look at first image always
    const firstImage = imgContainer.querySelector('img');
    if (img === firstImage) {
      setState({ scaleValue: scale, scaleNum: newScaleNum });
    }
  };

  const rotateFile = async (event, { angle, page }) => {
    let newAngle = rotateArr[page - 1] + angle;
    if (newAngle < 0) {
      newAngle = 270;
    }
    if (newAngle > 270) {
      newAngle = 0;
    }
    rotateArr[page - 1] = newAngle;
    setRotateArr(rotateArr);
    setState(
      {
        rotateLoading: angle > 0 ? 'CW' : 'CCW', // clockwise / counterclockwise
        scaleValue: 'pageRotateOption'
      },
      (newState) => {
        // recalc scale after rotate
        setScale(newState.scaleValue); // NOTE: use scaleValue on rotate
      }
    );
    await dossierInst.saveFileRotation({ dossierFile: file, angle: newAngle });
    setState({ rotateLoading: null });
  };

  const imageOnLoadHandler = (event, rotate) => {
    const img = event.target;
    const { scaleValue } = stateRef.current;
    setScalePerImg({ img, scale: scaleValue, rotate });
  };

  useEffect(() => {
    setRotateArr(new Array(images.length).fill(0));
  }, [images.length]);

  const { currentPage, pageText, scaleValue, scaleNum, rotateLoading } = state;
  return (
    <React.Fragment>
      <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <ControlsMenu
          attached="top"
          file={file}
          numPages={images.length}
          currentPage={currentPage}
          pageText={pageText}
          setPage={setPage}
          setPageText={setPageText}
          scaleValue={scaleValue}
          scaleNum={scaleNum}
          setScale={setScale}
          rotateFile={rotateFile}
          rotateLoading={rotateLoading}
        />
      </div>
      <div attached="bottom" className="file-dossier-img-container" ref={contentRef} style={{ height: 'calc(100% - 28px)' }}>
        {images.map((image, i) => (
          <div key={image.name}>
            <img
              src={image.src} // key={image.src}
              className={`ui fluid image file-dossier-img-rotate${rotateArr[i]}`}
              onLoad={(event) => imageOnLoadHandler(event, rotateArr[i])}
            />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

ImagesViewer.propTypes = {
  file: PropTypes.object.isRequired,
  images: PropTypes.array.isRequired,
  dossierInst: PropTypes.object.isRequired,
  contentRef: PropTypes.object.isRequired
};
