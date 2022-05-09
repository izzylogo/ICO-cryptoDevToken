import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal"; 
import {BigNumber, Contract, utils, providers} from "ethers"
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
  const zero = BigNumber.from(0)
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const [tokensMinted, setTokensMinted] = useState(zero);// this is the number/amount of token minted
  const [balanceOfCryptoDevTokens, setbalanceOfCryptoDevTokens] = useState(zero);//this is the amount of token the user has
  const [tokenAmount, setTokenAmount] = useState(zero)// this is the amount of token the user want to mint
  const [loading, setLoading] =useState(false)//we are showing the user that the transaction is in progress
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)// this is showing the number of token to be claimed

          //  Getting the ProviderOrSigner
  const getProviderOrSigner = async(needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
          //checking if you are on the rinkeby test network 
    if(chainId !== 4){
      window.alert("Change your network to Rinkeby");
      throw new Error("Change your network to Rinkeby");
    }
    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

          // Getting tokens to be claimed
  const getTokensToBeClaimed = async() => {
    try{
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        provider
      )
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ABI,
        TOKEN_CONTRACT_ADDRESS,
        provider
      )
      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()
      const balance = await nftContract.balanceOf(address)

      if(balance === zero){
        setTokensToBeClaimed(zero)
      }else {
        var amount = 0;

        for(var i = 0; i < balance; i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i)
          const claimed = await tokenContract.tokenIdsClaimed(tokenId)
          if(!claimed){
            amount++
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount))
      }
    }catch(err){
      console.error(err)
      setTokensToBeClaimed(zero)
    }
  }

          // Connecting to the wallet      
  const connectWallet = async() => {
    try{
      await getProviderOrSigner();
      setWalletConnected(true)
    }catch(err){
      console.error(err)
    }
  }

        // getting balance of the remaining crypto dev token
  const getBalanceOfCryptoDevTokens = async() => {
    try{
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );     
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setbalanceOfCryptoDevTokens(balance);
    }catch(err){
      console.error(err)
    }
  }

        // getting the total token minted
  const getTotalTokenMinted = async() => {
    try{
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
        const _tokensMinted = await tokenContract.totalSupply();
        setTokensMinted(_tokensMinted)
    }catch(err){
      console.error(err)
    }
  }
    

        // Adding function to mint cryptoDevToken
  const mintCryptoDevToken = async(amount) => {
    try{
      const signer = await getProviderOrSigner(true)
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const value = 0.001 * amount;

      // creating a transaction
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });

      setLoading(true);
      await tx;
      setLoading(false);
      window.alert("You have successfully minted a token");
      // functions to get the balance of the user and of that o the tokensMinted
      await getBalanceOfCryptoDevTokens();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
    }catch(err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet();
      getBalanceOfCryptoDevTokens();
      getTotalTokenMinted();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);

        // function to claim crypto dev token 
  const claimCryptoDevTokens = async() => {
    try{
      const signer = await getProviderOrSigner(true)
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("Successfully claimed Crypto Dev Tokens")
      await getBalanceOfCryptoDevTokens();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
    }catch(err){
      console.error(err)
    }
  }

        // Rendering Buttons
  const renderButton = () => {
        //loading button
    if(loading){
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      )
    }

        //showing the number of token to be claimed button
    if(tokensToBeClaimed > 0){
      return(
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      )
    }

    return (
      <div style={{display: "flex-col"}}>
        <input 
          type="number" 
          placeholder='Amount of Tokens' 
          onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
          />
        <button 
          className={styles.button} 
          disabled={!(tokenAmount > 0)} 
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    )
  };



        // The UserInterface
  return (
    <div>
      <Head>
        <title>Crypto Devs ICO</title>
        <meta name='description' content='ICO-dApp'/>
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <hi className={styles.title}>Welcome to Crypto Devs ICO</hi>
          <div className={styles.description}>
            You can clain or mint Crypto Devs Token here
          </div>
          {
            walletConnected ? (
              <div>
                <div className={styles.description}>
                  You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto Devs Token
                </div>
                <div className={styles.description}>
                  Overall {utils.formatEther(tokensMinted)}/10000 has been minted
                </div>
                {renderButton()}
              </div>
              ) : (
              <button onClick={connectWallet} className={styles.button}>
                Connect Your Wallet
              </button>
            ) 
          }
        </div>
        <div>
          <img className={styles.image} src="./0.svg"/>
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Izzy
      </footer>
    </div>

  )
}
