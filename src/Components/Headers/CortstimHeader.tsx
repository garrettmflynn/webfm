import React, { useContext, useEffect, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import { Context } from "../../Context";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import Modal from "react-bootstrap/Modal";
import ListGroup from "react-bootstrap/ListGroup";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import { fetch2DGeometry } from "../../helpers/pullAnatomicalData";
import {
  highlight2DElectrodes,
  highlight3DElectrodes
} from "../../helpers/mutateElectrodes";
import Button from 'react-bootstrap/Button'
import {Mesh,Color, Material, MeshPhysicalMaterial} from 'three'

import { Info } from "react-bootstrap-icons";

export default function CortstimHeader() {
  const {
    activeSubject,
    activeElec1,
    activeElec2,
    setActiveElec1,
    setActiveElec2,
    cortstimParams,
    setCortstimParams,
    setCortstimNotes,
    cortstimNotes,
    threeDElectrodes,
    brainType
  } = useContext(Context);
  const [electrodeNames, setElectrodeNames] = useState([]);

  useEffect(() => {
    (async () => {
      let electrodes = await fetch2DGeometry(activeSubject);
      setElectrodeNames(Object.keys(electrodes));
    })();
  }, [activeElec2]);

  useEffect(() => {
    if (activeElec1.length > 0) {
      let elecGroup = activeElec1.substring(
        0,
        activeElec1.indexOf(activeElec1.match(/\d+/g)[0])
      );
      let secondElecs = electrodeNames.filter((elec, i) => {
        if (
          elec.substring(0, elec.indexOf(elec.match(/\d+/g)[0])) == elecGroup
        ) {
          return electrodeNames[i];
        }
      });
      setElectrodeNames(secondElecs);
    }
  }, [activeElec1]);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  
  function parseJSONToCSVStr(jsonData) {

    let csvStr = `${activeSubject}, ${jsonData.date}
      Electrodes, Time, Task, Current, Frequency, Duration, Result, Notes, Color, Area
      `;
    jsonData.results.forEach(x => {
      if(x.resultingArea == undefined){
        x.resultingArea = ''
      }
      csvStr += `${x.electrodes}, ${x.time}, ${x.task}, ${x.current}, ${x.frequency}, ${x.duration}, ${x.result}, ${x.cortstimNotes.replace(',','.')}, ${x.color}, ${x.resultingArea} \n`
    });
    return encodeURIComponent(csvStr);
  }

  const fetchDataFromDB = async () => {
    let req = await fetch(`/api/data/cortstim/${activeSubject}`);
    let res = await req.json();

    
    let csvStr = parseJSONToCSVStr(res);
    let dataUri = "data:text/csv;charset=utf-8," + csvStr;

    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", `cortstim_${activeSubject}.csv`);
    linkElement.click();
    
  };

  return (
    <>
      <Navbar
        style={{
          backgroundColor: "lightgray",
          zIndex: 999,
          marginBottom: "10px",
        }}
        expand="lg"
        >
        <Navbar.Brand href="/dashboard">WeBrain - Cortstim</Navbar.Brand>
        <Navbar.Brand className="justify-content-center">
          {activeSubject}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">

        <NavDropdown title={activeElec1} id="elecSelection1">
          {electrodeNames ? (
            electrodeNames.map((name) => (
              <NavDropdown.Item
                onClick={() => {
                  if(brainType == "2D"){
                    highlight2DElectrodes(name, "red", 3);
                  }
                  if(brainType == "3D"){
                    //@ts-ignore
                    let child = threeDElectrodes.getObjectByName(name)
                    let newMat = child.material.clone();
                    newMat.color = new Color('red')
                    child.material = newMat;
                    child.scale.set(3,3,3)

                }
                  setActiveElec1(name);
                }}
              >
                {name}
              </NavDropdown.Item>
            ))
          ) : (
            <></>
          )}
        </NavDropdown>
        <NavDropdown title={activeElec2} id="elecSelection2">
          {electrodeNames ? (
            electrodeNames.map((name) => (
              <NavDropdown.Item
                onClick={() => {
                  if(brainType=="2D"){
                    highlight2DElectrodes(name, "red", 3);
                  }
                  if(brainType == "3D"){
                    let child = threeDElectrodes.getObjectByName(name)
                    let newMat = child.material.clone();
                    newMat.color = new Color('red')
                    child.material = newMat;
                    child.scale.set(3,3,3)
                }
                  setActiveElec2(name);
                }}
              >
                {name}
              </NavDropdown.Item>
            ))
          ) : (
            <></>
          )}
        </NavDropdown>
        <Form style={{ width: "90px" }}>
          <FormControl
            size="sm"
            type="text"
            value={cortstimParams.freq}
            className="mr-sm-2 text-center"
            onChange={(e) => {
              setCortstimParams({
                ...cortstimParams,
                freq: parseInt(e.target.value),
              });
            }}
          />
          <Form.Text className="text-muted text-center">Frequency (Hz) </Form.Text>
        </Form>
        <Form style={{ width: "90px" }}>
          <FormControl
            size="sm"
            type="text"
            value={cortstimParams.duration}
            className="mr-sm-1 text-center"
            onChange={(e) => {
              setCortstimParams({
                ...cortstimParams,
                duration: parseInt(e.target.value),
              });
            }}
          />
          <Form.Text className="text-muted text-center">Duration (s) </Form.Text>
        </Form>

        <Form style={{ width: "90px" }}>
          <FormControl
            size="sm"
            type="text"
            value={cortstimParams.current}
            className="mr-sm-3 text-center text-center"
            onChange={(e) => {
              setCortstimParams({
                ...cortstimParams,
                current: parseInt(e.target.value),
              });
            }}
          />
          <Form.Text className="text-muted text-center">Current (mA)</Form.Text>
        </Form>

        <Form style={{ width: "200px" }}>
          <FormControl
            size="sm"
            type="text"
            value={cortstimNotes}
            className="mr-sm-3 text-center text-center"
            onChange={(e) => setCortstimNotes(e.target.value)}
          />
          <Form.Text className="text-muted text-center">Notes</Form.Text>
        </Form>
        <Button onClick={async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            fetchDataFromDB();
          }}
        >Generate Report</Button>

        <Info
          color="royalblue"
          className="ml-auto"
          size={30}
          onClick={handleShow}
        ></Info>
      </Navbar.Collapse>
      </Navbar>


      <Modal show={show} onHide={handleClose}>
        <Tabs defaultActiveKey="guide" id="uncontrolled-tab-example">
        <Tab eventKey="guide" title="Guide">
          <Modal.Body>
            <ListGroup>
              <ListGroup.Item>Select the stimulating electrodes</ListGroup.Item>
              <ListGroup.Item>Select the stimulation parameters</ListGroup.Item>
              <ListGroup.Item>If titrating, select "No task", if performing a task, select "Task"</ListGroup.Item>
              <ListGroup.Item>If performing a task, select the task from the "Task description" dropdown</ListGroup.Item>
              <ListGroup.Item>If an effect was elicited select which effect from the "Effect" dropdown, else select clear</ListGroup.Item>
              <ListGroup.Item>If the effect was a motor or sensory response, select "Motor" or "Sensory" from the "Effect" dropdown, then select "Left/Right", then select which area by clicking on the corresponding circle on the homunculus image</ListGroup.Item>
              <ListGroup.Item>When complete, select the "Trial Complete" button and run the next stimulation</ListGroup.Item>
            </ListGroup>

          </Modal.Body>
          </Tab>
          <Tab eventKey="changelog" title="Changelog">
            <Modal.Body>
              <ListGroup>
                <ListGroup.Item>10/27/20: Added changelog and How-to</ListGroup.Item>
                <ListGroup.Item>
                  10/26/20: Added left/right selection for homunculus
                </ListGroup.Item>
                <ListGroup.Item>
                  10/26/20: Trial complete and Clear buttons revert app to
                  default state
                </ListGroup.Item>
                <ListGroup.Item>
                  10/22/20: Embeded legend colors into Effect dropdown
                </ListGroup.Item>
                <ListGroup.Item>
                  10/20: Moved non-task related UI elements into headers
                  (elecs/params/notes)
                </ListGroup.Item>
                <ListGroup.Item>
                  10/20: Second electrode selection depends on first electrode
                  (matching groups)
                </ListGroup.Item>
              </ListGroup>
            </Modal.Body>
          </Tab>
        </Tabs>
      </Modal>
    </>
  );
}
