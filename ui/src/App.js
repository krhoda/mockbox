import React, {useEffect} from 'react';
import logo from './logo.svg';
import './App.css';

const serverBase = "http://localhost:8000/"
const makeURL = (suffix) => {
  return `${serverBase}${suffix}`;
}

function App() {
  useEffect(() => {
    let targetRoute = "hello";
    let targetURL = makeURL(targetRoute);

    fetch(targetURL)
      .then((result) => {
        console.log("SUCCESS, RESULT:");
        console.log(result);
        // targetRoute = "fake_file";
        targetRoute = "files";
        targetURL = makeURL(targetRoute);
        fetch(targetURL) 
          .then((result2) => {
            console.log("DOUBLE SUCCESS:");
            result2.json()
              .then((json) => {
                console.log("TRIPLE SUCCESS:");
                console.log(json);
              })
              .catch((err) => {
                console.log("FAILED IN PARSE JSON.");
                console.log(err);
              });
          })
          .catch((err) => {
            console.log("FAILED IN SECOND REQUEST:")
            console.log(err);
          });
      })
      .catch((err) => {
        console.log("OH NO")
        console.log(err);
      })
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
