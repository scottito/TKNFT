import { useEffect, useState } from "react";

import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar, makeStyles, Typography, useMediaQuery } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
//import ProgressBar from '@ramonak/react-progress-bar'
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import { LinearProgress } from "@material-ui/core";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

import background from './background/IMG_9364.png';
//import { Box } from "@material-ui/system";


const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)``; // add your styles here


export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const [itemsCurrent, setItemsCurrent] = useState(0)

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsAvailable,
        itemsRemaining,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      const anchorWallet = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as anchor.Wallet;

      const { candyMachine, goLiveDate, itemsRemaining } =
        await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );

      setIsSoldOut(itemsRemaining === 0);
      setItemsCurrent(itemsRemaining);

      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);


  // const ProgressBarModal = () => {
  //   return <ProgressBar
  //     completed={100 - (itemsCurrent / 7027)}
  //     bgColor='#FE6B8B' width='50%'
  //     isLabelVisible={false}
  //     margin="40% auto"
  //   />
  // }

  
  
  const classes = useStyles()

  return (
    <main className={classes.cover}>
      {/* {wallet.connected && (
        <p>Address: {shortenAddress(wallet.publicKey?.toBase58() || "")}</p>
      )}
      {wallet.connected && (
        <p>Balance: {(balance || 0).toLocaleString()} SOL</p>
      )} */}
<div>
            
            </div>
      <MintContainer>
        {!wallet ? (
          <div className={classes.centerConnect}>
            <ConnectButton>Connect Wallet</ConnectButton>
          </div>
        ) : (
          <>
            
            <div className={classes.mintArea}>
              
              <MintButton
                disabled={isSoldOut || isMinting || !isActive}
                
                onClick={onMint}
                style={{ flex: 1 }}
                variant="contained"
                className={classes.mint}
              >
                {isSoldOut ? (
                
                  "SOLD OUT"
                ) : isActive ? (
                  isMinting ? (
                    <CircularProgress />
                  ) : (
                    "MINT"
                  )
                ) : (
                  <Countdown
                    // className = {classes.countDown}
                    date={startDate}
                    onMount={({ completed }) => completed && setIsActive(true)}
                    onComplete={() => setIsActive(true)}
                    renderer={renderCounter}
                  />
                )}
              </MintButton>
              {/* <Box sx={{ width: '100%' }}>
                   <LinearProgress className = {classes.progressBarClass} variant="determinate" value={(5-itemsCurrent)/5 * 100} />
              </Box> */}
              <Typography className = {classes.price}>
                
                Price: 0.75 SOL
              </Typography>
              { <Typography variant= "h4" className = {classes.howManyRemaining}>
                {itemsCurrent} TimeKeepers remaining
              </Typography> }
            </div>
          </>
        )}
      </MintContainer>

      {/* <Button className = {classes.homeButton}>Go back Home</Button> */}
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours}:{minutes}:{seconds}
    </CounterText>
  );
};

const useStyles = makeStyles(theme => ({
  mint: {
    background: 'white',
    color: 'black',
    border: 0,
    borderRadius: 3,
    // boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    height: 50,
    width: 200,
    padding: '30px 30px',
    '&:disabled':{
    
      backgroundColor:'grey',
      color:'white',
      opacity:'0.5'
    },
    '&:hover': {
      backgroundColor: 'white',
      boxShadow: '0 0 70px white',
      //  -webkit-box-reflect:below 1px linear-gradient(transparent, #0005)',
      color: 'black'
    }
  },
  bar: {
    position: 'absolute',
    top: '80%'
  },
  soldOut: {
    color: 'whitesmoke'
  },
  cover: {
    backgroundImage: `url(${background})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    width: '100%',
    height: '100%',
    position: 'absolute',
    margin: '0 auto'
  },
  progressBarClass: {
    transform:'translate(0%, 150%)',
    height:'10px',
    width:'500px',
    borderRadius:'50px',
    backgroundColor:'black'
    

  },
  centerConnect: {
    position: 'absolute',
    top: '75%',
    right: '45%'
  },
  // typography: {
  //   color: 'white',
  //   position: 'absolute', left: '50%', top: '83%',
  //   transform: 'translate(-50%, -50%)',
  // },
  mintArea: {
    color: 'white',
    position: 'absolute', left: '50%', top: '68%',
    transform: 'translate(-50%, -50%)',
    fontSize: '60px',
    textAlign: 'center',
  },
  price: {
    fontSize: '25px',
    // display: "flex",
    marginTop:'20px',
    fontFamily:'Lato',
    justifyContent: "center",
  },
  price1:{
    fontSize: '50px',
    color:'white',
    // display: "flex",
    position:'absolute',
    margin:'0 auto',
    top:'50%',
    left:'50%',
    transform:'translate(-50%,-400%)',
    fontFamily:'Lato',
    alignSelf:'center',
  
  },
  howManyRemaining:{
    fontSize:'25px',
    fontFamily:'Lato'
  },
  // progressModal: {
  //   '@media (min-width: 375)': {
  //     top: '80%'
  //   },
  //   '@media (max-width: 812)': {
  //     top: '80%'
  //   }
  // },
  homeButton: {
    borderRadius: 3,
    background: 'linear-gradient(to right, #E7E9BB, #403B4A)',
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    height: 45,
    width: 150,
    padding: '5px 5px',
    position: 'absolute', left: '10%', top: '10%',
    transform: 'translate(-50%, -50%)',
  }
}));

export default Home;
