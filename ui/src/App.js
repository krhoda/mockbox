import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';

const serverBase = "http://localhost:8000/"
const makeURL = (suffix) => {
  return `${serverBase}${suffix}`;
}

const getFile = (targetFile, errHandler) => {
  let targetPath = `files/${targetFile}`;
  let targetURL = makeURL(targetPath);
  fetch(targetURL)
    .then((result) => {
      if (!result.ok) {
        return errHandler(`Received bad status code in get file: ${result.status}`)
      }
      result
      .blob()
      .then((blob) => {
        let nextURL = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = nextURL;
        a.download = targetFile;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        return errHandler(`Failed to convert to blob in get file: ${err}`)
      })
    })
}

function App() {
  let [errStatus, setErrStatus] = useState('');
  let [fileList, setFileList] = useState([]);

  useEffect(() => {
    let targetURL = makeURL("files");

    fetch(targetURL)
      .then((result) => {
        if (!result.ok) {
          return setErrStatus(`Received bad status code in init: ${result.status}`)
        }
        result
        .json()
        .then((json) => {return setFileList(json)})
        .catch((err) => {
          console.log("Failed in JSON parse:")
          console.log(err);
          setErrStatus(`${err}`);
        })

      })
      .catch((err) => {
        console.log("Failed in Fetch:")
        console.log(err);
        setErrStatus(`${err}`);
      })
  }, []);

  let errHolder = '';
  if (errStatus !== '') {
    errHolder = (
      <div className="err-holder">
        {errStatus}
      </div>
    );
  }

  let fileListHolder = 'No Files';
  if (fileList.length > 0) {
    fileListHolder = [];
    for (let i = 0, x = fileList.length; i < x; i++) {
      let entry = fileList[i];
      let elm = (
        <div className="file-elm" key={`file-elm-${i}`}>
          <p>Name: {`${entry.name}`}</p>
          <p>Extension: {`${entry.ext}`}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              return getFile(entry.name, setErrStatus);
            }}
          >
            Download
          </button>
        </div>
      );
      fileListHolder.push(elm);
    }
  }

  return (
    <div className="App">
      {errHolder} 
      <div className="file-list-holder" >
        <h2>Uploaded Files:</h2>
        <div className="file-list">
          {fileListHolder}
        </div>
      </div>
    </div>
  );
}

export default App;
