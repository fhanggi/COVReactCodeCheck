import { useState } from "react";
import "./App.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>

      <section>
        <h2>Filming will:</h2>
        <ul>
          <li>
            Be performed only with hand-held devices. Hand-held devices include:
            <ul>
              <li>
                Motion or still cameras or other equipment that are always held in the filmmaker’s or photographer’s hands while
                filming
              </li>
              <li>Tripods used to support motion or still cameras</li>
            </ul>
          </li>
          <li>
            Only take place on a City sidewalk, City park pathway, or walkway of a City bridge, while making sure pedestrian
            access:
            <ul>
              <li>Remains at least 1.5 meters clear for pedestrian use if the total width of the area is 5 meters or less</li>
              <li>Remains half the width clear for pedestrian use if the total width of the area is greater than 5 meters</li>
            </ul>
          </li>
        </ul>

        <h2>Filming will not:</h2>
        <ul>
          <li>Take place on a date and time and in a location required for City use or covered by an existing City permit</li>
          <li>
            Take place in traffic lanes or curb lanes of City streets with filming contained to a City sidewalk, City park
            pathway, or City bridge walkway
          </li>
          <li>
            Take place in these restricted locations:
            <ul>
              <li>Stanley Park</li>
              <li>VanDusen Gardens</li>
              <li>Queen Elizabeth Park</li>
              <li>The seawall</li>
              <li>Playgrounds, basketball courts, baseball fields, tennis courts, or outdoor pools</li>
            </ul>
          </li>
          <li>
            Involve activity that violates law, creates a safety hazard, and/or involves exclusive use of any part of a City
            sidewalk, City park pathway, or City bridge walkway
          </li>
          <li>
            Involve the:
            <ul>
              <li>Use of any props that are not handheld</li>
              <li>
                Actual or simulated weapons, police uniforms, re-enactment of a crime on City property, or other activity that
                would require the presence or approval of the Vancouver Police Department
              </li>
              <li>Use of special effects (including pyrotechnics)</li>
              <li>Use of prohibited wild animals</li>
              <li>Use of drones</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="responsibilities">
        <h2>Your responsibilities</h2>
        <label>
          <input type="checkbox" /> Yes, I have read and certify that my activity meets all the conditions listed on this page and
          will take place only on the outside of public property owned by the City of Vancouver.
        </label>
        <button>Download letter</button>
      </section>
    </>
  );
}

export default App;
