import './App.css';
import {useEffect} from 'react'

function App() {
  useEffect(() => {
    document.title = "Curve collector";
  }, [])
  return (
    <div className="App">
      <div id="canvas"></div>
    </div>
  );
}

export default App;
