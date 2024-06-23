import React, { useEffect } from "react";
import styled from "styled-components";
import { envUrl } from "./RuntimeConfig";
import Xarrow from "react-xarrows";
const deleteImg = "https://www.svgrepo.com/show/21045/delete-button.svg";

const RNumOnly = /^\d+$/;

const MainCon = styled.div`
  gap: 50px;
  display: grid;
  padding: 40px 0;
  grid-template-columns: repeat(4, 1fr);
`;

export interface INodedata {
  key: string;
  value: string;
  expiration: string;
}

const TextBox = styled.div`
  display: flex;
  justify-content: center;
`;

const Box = styled.div<{ col: number; row: number }>`
  grid-column: ${(props) => props.col};
  grid-row: ${(props) => props.row};
  width: 200px;
  height: 100px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 18px;
  border-radius: 15%;
  margin: auto;
`;

const InputStyled = styled.input`
  font-size: large;
  height: 35px;
  padding: 4px;
`;

const BodyCon = styled.div``;
const TopBarCon = styled.div`
  padding: 0 25px;
  padding-top: 5px;
  display: flex;
  gap: 20px;
`;

const Btn = styled.button<{ disabled: boolean }>`
  background-color: ${({ disabled }) => (disabled ? "grey" : "#04AA6D")};
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  padding: 0 16px;
  border-radius: 5px;
  cursor: pointer;
`;

const DeleteSvg = styled.img`
  position: absolute;
  width: 18px;
`;

function NodeArrow(box1Ref: string, box2Ref: string) {
  return <Xarrow start={box1Ref} end={box2Ref} showHead showTail />;
}



export default function LruCon() {
  const [nodes, setNodes] = React.useState<INodedata[]>([]);
  const [value, setVal] = React.useState<string>("");
  const [expTime, setExpTime] = React.useState<string>("");
  const [key, setKey] = React.useState<string>("");
  const [isLoading, setIsLoading ] = React.useState<boolean>(false);
  const [min, setMin ] = React.useState<number>(Infinity);
  const [curr, setCurr ] = React.useState<number>(0);

  function fetchAndSetNodes() {
    fetch(`${envUrl}get`).then((res) => {
      res.text().then((data) => {
        const setData: INodedata[] = (JSON.parse(data));
        let myMin = Infinity
        setData.forEach(ele=>{
          ele.expiration = Math.floor((parseInt(ele.expiration)*1000- (Date.now()))/1000).toString();
          myMin=Math.min(parseInt(ele.expiration),myMin);
        })
        setMin(myMin);
        setNodes(setData)
        setIsLoading(false)
      });
    });
  }


  useEffect(() => {
    setIsLoading(true)
    fetchAndSetNodes();
    const intverlId = setInterval(()=>{
      if(min>-1) {
        setMin(min=>min-1)
        setCurr(curr=>curr+1)
      }
      else{
        fetchAndSetNodes()
      }
    },1000)
    return ()=>clearInterval(intverlId);
  }, []);

  function validateAndfetch(val : number){
    if(val<0){
      // eslint-disable-next-line no-restricted-globals
      location.reload()
    }
    return val;
  }

  const addNode = () => {
    setIsLoading(true)
    fetch(
      `${envUrl}set` +
        `?key=${key}&value=${value}&expiration=${expTime}`
    ).then((res) => {
      fetchAndSetNodes();
    });
    setVal("");
    setExpTime("");
    setKey("");
  };

  function deleteNode(key: string) {
    setIsLoading(true)
    fetch(`${envUrl}delete` + `?key=${key}`).then((res) => {
      fetchAndSetNodes();
    });
  }



  return (
    <BodyCon>
      <TopBarCon>
        <InputStyled
          type="text"
          value={value}
          placeholder="Value"
          onChange={(e) => setVal(e.target.value.toString())}
        />
        <InputStyled
          type="text"
          value={expTime}
          placeholder="Expiry Time in seconds"
          onChange={(e) =>
            (RNumOnly.test(e.target.value) || e.target.value === "") &&
            setExpTime(e.target.value)
          }
        />
        <InputStyled
          type="text"
          value={key}
          placeholder="Key"
          onChange={(e) => setKey(e.target.value)}
        />
        <Btn onClick={addNode} disabled={!value || !key || !expTime}>
          Add Cache
        </Btn>
        <Btn onClick={fetchAndSetNodes} disabled={false}>
          Refetch
        </Btn>
      </TopBarCon>
      <MainCon>
        {nodes?.map((ele, ind) => {
          return (
            <Box
              id={"ind_" + ind}
              col={Math.floor(ind / 4) % 2 ? 4 - (ind % 4) : (ind % 4) + 1}
              row={Math.floor(ind / 4) + 1}
            >
              <DeleteSvg src={deleteImg} onClick={()=>deleteNode(ele.key)}/>
              <TextBox> Key : {ele.key} </TextBox>
              <TextBox> Value : {ele.value} </TextBox>
              <TextBox> Time : {validateAndfetch(parseInt(ele.expiration) - curr)} </TextBox>
            </Box>
          );
        })}
      </MainCon>
      {!isLoading && <div>
        { nodes?.map((_, ind) => {
          if (ind === 0) return <></>;
          return NodeArrow("ind_" + ind, "ind_" + (ind - 1));
        })}
      </div>}
    </BodyCon>
  );
}
