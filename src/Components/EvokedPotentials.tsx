import React, { useEffect, useState, useContext } from "react";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { extent } from "d3-array";
import { line } from "d3-shape";
import { OverlayTrigger, Tooltip, Container, Col, Row } from "react-bootstrap";
import { Context } from "../Context";
import { interpolateSpectral } from "d3-scale-chromatic";
import { highlightElectrodes } from "../Components/Cortstim/ElectrodeAttributes";

export default function EvokedPotentials() {
  const [data, setData] = useState(0);
  const [width, setWidth] = useState(0);
  const [stimulatingElectrodes, setStimulatingElectrodes] = useState<
    string[]
  >();
  const [zScores, setZScores] = useState([]);
  const [zTimePoint, setZTimePoint] = useState([]);
  const [anatomicalLocation, setAnatomicalLocation] = useState([]);

  const { subject, setNewSubject } = useContext(Context);

  useEffect(() => {
    var urlParams = new URLSearchParams(window.location.search);

    let recordType = urlParams.get("type");
    let recordName = urlParams.get("record");
    let subjectName = urlParams.get("subject");

    (async () => {
      let fetchRoute = `/api/data/${subjectName}/${recordName}/${recordType}`;
      let response = await fetch(fetchRoute);
      let respData = await response.json();
      let req = await fetch(`/api/geometry/${subjectName}`);
      let res = await req.json();
      setNewSubject({
        name: subjectName,
        geometry: res,
      });

      const chartContainer = document.getElementById("fm");
      let elec1 = recordName.split("_")[0];
      let elec2 = recordName.split("_")[1];
      setStimulatingElectrodes([elec1, elec2]);
      setWidth(chartContainer.offsetWidth);
      setData(respData);
    })();
  }, []);

  useEffect(() => {
    const sleep = (m) => new Promise((r) => setTimeout(r, m));

    if (data) {
      (async () => {
        var x = scaleLinear()
          .domain([0, data[Object.keys(data)[0]].times.length])
          .range([0, width]);
        let locData = {};

        stimulatingElectrodes.forEach((elec) =>
          highlightElectrodes(elec, "green")
        );

        let circle1 = document.getElementById(
          `${stimulatingElectrodes[0]}_circle`
        );
        let circle2 = document.getElementById(
          `${stimulatingElectrodes[1]}_circle`
        );
        // await sleep(2000);
        let xPos;
        let yPos;
        if (circle1.getAttribute("cx") != "0") {
          xPos =
            (parseFloat(circle1.getAttribute("cx")) +
              parseFloat(circle2.getAttribute("cx"))) /
            2;
          yPos =
            (parseFloat(circle1.getAttribute("cy")) +
              parseFloat(circle2.getAttribute("cy"))) /
            2;
          select("#imgContainer")
            .select("svg")
            .append("circle")
            .attr("cx", xPos)
            .attr("cy", yPos)
            .attr("r", 10)
            .attr("fill", "blue");
          let responseGeometry = Object.keys(data).map((electrode) => {
            let y = scaleLinear()
              //@ts-ignore
              .domain(extent(data[electrode].times))
              .range([0, 40]);

            //Sets stimulation onset marker
            select(`#${electrode}_container`)
              .append("line")
              .attr("x1", x(500))
              .attr("y1", 0)
              .attr("x2", x(500))
              .attr("y2", 40)
              .attr("stroke", "red")
              .attr("stroke-width", "1");

            //Creates the time series plot
            select(`#${electrode}_path`)
              .datum(data[electrode].times)
              .attr(
                "d",
                line()
                  .x((d, i) => x(i))
                  .y((d, i) => y(d))
              );

            electrode
              .split("_")
              .forEach((elec) => highlightElectrodes(elec, "red"));
            //Get's the x & y coordinates of the stimulation electrodes on the 2D plot
            let xCoord = document.getElementById(
              `${electrode.split("_")[0]}_circle`
            )
              ? (parseFloat(
                  document
                    .getElementById(`${electrode.split("_")[0]}_circle`)
                    .getAttribute("cx")
                ) +
                  parseFloat(
                    document
                      .getElementById(`${electrode.split("_")[1]}_circle`)
                      .getAttribute("cx")
                  )) /
                2
              : 0;
            let yCoord = document.getElementById(
              `${electrode.split("_")[0]}_circle`
            )
              ? (parseFloat(
                  document
                    .getElementById(`${electrode.split("_")[0]}_circle`)
                    .getAttribute("cy")
                ) +
                  parseFloat(
                    document
                      .getElementById(`${electrode.split("_")[1]}_circle`)
                      .getAttribute("cy")
                  )) /
                2
              : 0;
            return [
              xCoord,
              yCoord,
              data[electrode].zscores,
              locData[electrode],
            ];
          });

          let zscores = responseGeometry.map((elec) => elec[2][1].toFixed(1));
          let zTimePoint = responseGeometry.map((elec) =>
            elec[2][0].toFixed(1)
          );
          setZScores(zscores);
          setZTimePoint(zTimePoint);
          let locations = responseGeometry.map((elec) => {
            if (elec[0] != 0 && elec[3] != undefined) {
              return elec[3];
            } else return "Unknown";
          });
          setAnatomicalLocation(locations);

          responseGeometry.forEach((elec, i) => {
            console.log(elec);
            // let color = interpolateRdBu(zscores[i] / Math.max(...zscores));
            // let color = interpolatePuOr(zscores[i] / Math.max(...zscores));
            // let color = interpolateRdYlBu(zscores[i] / Math.max(...zscores));
            let color = interpolateSpectral(zscores[i] / Math.max(...zscores));

            if (elec[0] != 0 && circle1 != null) {
              select("#container")
                .select("svg")
                .append("line")
                .attr("x1", xPos)
                .attr("y1", yPos)
                .attr("x2", elec[0])
                .attr("y2", elec[1])
                .attr("stroke", color)
                .attr("stroke-width", "3");
            }
          });
        }
      })();
    }
  }, [data]);

  const mouseEntered = (e) => {
    let channelSelected = e.target.getAttribute("title");
    let electrodeDot = document.getElementById(`${channelSelected}_circle`);
    select(electrodeDot).attr("fill", "red").attr("r", "10");
  };
  const mouseLeft = (e) => {
    let channelSelected = e.target.getAttribute("title");
    let electrodeDot = document.getElementById(`${channelSelected}_circle`);
    select(electrodeDot).attr("fill", "white").attr("r", "2");
  };
  return (
    <div id="fm">
      {data &&
        Object.keys(data).map((electrode, i) => {
          return (
            <OverlayTrigger
              key={`${electrode}_overlay`}
              placement="auto"
              overlay={
                <Tooltip id={`tooltip-${electrode}`}>
                  <div>
                    {electrode}
                    <br />
                    z-score:{" "}
                    <strong>
                      {zScores[i]} @ {zTimePoint[i]}
                    </strong>
                    .
                    <br />
                    Location: <strong>{anatomicalLocation[i]}</strong>.
                  </div>
                </Tooltip>
              }
            >
              <svg
                //@ts-ignore
                title={electrode}
                width={width}
                height={"40px"}
                onMouseEnter={(e) => mouseEntered(e)}
                onMouseLeave={(e) => mouseLeft(e)}
                id={`${electrode}_container`}
              >
                <text x="0" y="20" fontWeight="bold" fontSize="16">
                  {electrode}
                </text>
                <path
                  id={`${electrode}_path`}
                  width={width}
                  fill={"none"}
                  stroke={"steelblue"}
                  strokeWidth={1.5}
                ></path>
              </svg>
            </OverlayTrigger>
          );
        })}
    </div>
  );
}
