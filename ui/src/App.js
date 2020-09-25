import React, {useEffect, useState} from 'react';
import './App.css';

const serverBase = "http://localhost:8000/"
const makeURL = (suffix) => {
  return `${serverBase}${suffix}`;
}

const getFileList = (listHandler, errHandler) => {
  let targetURL = makeURL("files");

  fetch(targetURL)
    .then((result) => {
      if (!result.ok) {
        return errHandler(`Received bad status code in init: ${result.status}`)
      }
      result
        .json()
        .then((json) => {return listHandler(json)})
        .catch((err) => {
          console.log("Failed in JSON parse:")
          console.log(err);
          errHandler(`${err}`);
        })
    })
    .catch((err) => {
      console.log("Failed in Fetch:")
      console.log(err);
      errHandler(`${err}`);
    })
}


const downloadFile = (targetFile, errHandler) => {
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

const uploadFile = (opts, optsHandler, listHandler, errHandler) => {
  if (!opts) {
    return errHandler("No file selected");
  }

  let targetURL = makeURL("files");
  fetch(targetURL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(opts)
  }).then((res) => {
    if (!res.ok) {
      console.error("Failed in upload Request:")
      console.error(res);
      return errHandler("Failed in upload request, does the file already exist?");
    }

    optsHandler(false);
    document.querySelector('#suploader').value = null;

    return getFileList(listHandler, errHandler);
  })
}

const deleteFile = (targetFile, listHandler, errHandler) => {
  let targetPath = `files/${targetFile}`;
  let targetURL = makeURL(targetPath);

  fetch(targetURL, {method: "DELETE"})
    .then((res) => {
      if (!res.ok) {
        console.error("Failed in Delete Req:")
        console.error(res);

        errHandler("Failed in Delete Request, reloading list...");
      }

      getFileList(listHandler, errHandler);
    })
    .catch((err) => {
      console.error("Failed in Delete Req:")
      console.error(err);
      errHandler(err);
    })
}

function App() {
  let [errStatus, setErrStatus] = useState('');
  let [fileList, setFileList] = useState([]);
  let [upFileOpts, setUpFileOpts] = useState(false);

  useEffect(() => {
    getFileList(setFileList, setErrStatus);
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
              return downloadFile(entry.name, setErrStatus);
            }}
          >
            Download
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              return deleteFile(entry.name, setFileList, setErrStatus);
            }}
          >
            Delete
          </button>

        </div>
      );
      fileListHolder.push(elm);
    }
  }

  let upBtn = '';
  if (upFileOpts) {
    upBtn = (
      <button
        onClick={(e) => {
          e.preventDefault();
          uploadFile(
            upFileOpts, 
            setUpFileOpts, 
            setFileList, 
            setErrStatus
          );
        }}
      >
        Upload!
      </button>
    );
  }

  return (
    <div className="App">
      {errHolder} 
      <div className="file-uploader">
        <input 
          type="file"
          id="suploader"
          onClick={(e) => {
            e.target.value = null;
            setUpFileOpts(false);
          }}
          onChange={(e) => {
            let {value} = e.target;
            let sep = "/";
            if (value[0] !== "~" && value[0] !== "/") {
              sep = "\\";
            }
            let valueList = value.split(sep);
            let fname = valueList[valueList.length - 1];
            let reader = new FileReader();

            reader.onload = () => {
              let fbody = reader.result.split(",");
              let opts = {
                name: fname,
                body: fbody[fbody.length-1]
              }
              console.log(opts);
              setUpFileOpts(opts);
            }

            reader.onerror = (err) => {
              setErrStatus(err);
            }

            let file = document.querySelector('#suploader').files[0];
            reader.readAsDataURL(file)
          }}
        ></input>
        <br></br>
        {upBtn}
      </div>
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
