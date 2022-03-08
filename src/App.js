import "./App.css";
import React from "react";
import * as echarts from "echarts";

// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
};

function App() {
  const [inputFileData, setInputFileData] = React.useState(""); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(""); // represented as readable data (text string)
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState("Submit");

  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    console.log("converting file to bytes...");
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const draw = (xData, yData) => {
    var myChart = echarts.init(document.getElementById("main"));

    var option = {
      grid: {
        bottom: 350,
      },
      xAxis: {
        type: "category",
        data: xData,
        axisLabel: {
          rotate: 90,
        },
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: yData,
          type: "bar",
        },
      ],
    };
    console.log(option);
    myChart.setOption(option);
  };

  // handle file input
  const handleChange = async (event) => {
    // Clear output text.
    setOutputFileData("");

    console.log("newly uploaded file");
    const inputFile = event.target.files[0];
    console.log(inputFile);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    const base64DataArray = base64Data.split("base64,"); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log("file converted successfully");

    // enable submit button
    setButtonDisable(false);
  };

  // handle file submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setButtonText("Loading Result");

    // make POST request
    console.log("making POST request...");
    fetch("https://0kejp8e23g.execute-api.us-east-1.amazonaws.com/prod/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      body: JSON.stringify({ image: inputFileData }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("getting response...");

        // POST request error
        if (data.statusCode === 400) {
          const outputErrorMessage = JSON.parse(data.errorMessage)[
            "outputResultsData"
          ];
          setOutputFileData(outputErrorMessage);
        }

        // POST request success
        else {
          const outputBytesData = JSON.parse(data.body)["outputResultsData"];
          const data2 = decodeFileBase64(outputBytesData);

          const [x, y] = data2.replace(/\r\n/g, "").split(":");
          const xData = x.split(",");
          const yData = y.split(",");
          draw(xData, yData);
          setOutputFileData(data2);
        }

        // re-enable submit button
        setButtonDisable(false);
        setButtonText("Submit");
      })
      .then(() => {
        console.log("POST request success");
      });
  };

  return (
    <div className="App">
      <div className="Input">
        <h1>
          input txt file with predicion time in 24 hr format in it(ex: 1 means 1
          am to 2 am, 20 means 8 pm to 9 pm)
        </h1>
        <form onSubmit={handleSubmit}>
          <input type="file" accept=".txt" onChange={handleChange} />
          <button type="submit" disabled={buttonDisable}>
            {buttonText}
          </button>
        </form>
      </div>
      <div className="Output">
        <h1>Prediction</h1>
        {/* <p>{outputFileData}</p> */}
        <div id="main" className="w-g-ech"></div>
      </div>
    </div>
  );
}

export default App;
