// ------------------------------------------------------------------------------------------------------------------- //
// ----------------------- //
// ----- Deploy Page ----- //
// ----------------------- //

import { useEffect, useState } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

import './App.css';

import notlogo from './assets/cmc-not-logo.png';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState('');

  const [btcAddress, setBtcAddress] = useState('');
  const [discordID, setDiscordID] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [eligibleForAirdrop, setEligibleForAirdrop] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // ------------------------------------------------------------------------------------------------------------------- //
  // ----------------------- //
  //    Connect Functions    //
  // ----------------------- //

  async function authenticate() {
    showConnect({
      appDetails: {
        name: 'Moonlabs',
        icon: notlogo,
      },
      redirectTo: '/',
      onFinish: () => {
        // Reset form fields and flags
        setBtcAddress('');
        setDiscordID('');
        setDiscordHandle('');
        setEligibleForAirdrop(false);
        setAlreadySubmitted(false);
        setAuthenticated(true);
        const userData = userSession.loadUserData();
        setUserPrincipal(userData?.profile?.stxAddress.mainnet);
      },
      userSession: userSession,
    });
  }




  useEffect(() => {
    const checkEligibility = async () => {
      if (userPrincipal !== '') {
        await checkAirdropEligibility(userPrincipal);
        await checkIfSubmitted(userPrincipal);
      }
    };
    checkEligibility();
    
  }, [userPrincipal]);

  // ------------------------------------------------------------------------------------------------------------------- //
  // ----------------------- //
  //    Submit Functions     //
  // ----------------------- //

  async function checkIfSubmitted(stxAddress: string) {
    // Replace with actual check for submissions, e.g., fetching from your server
    const response = await fetch(`https://nscribed.it/PHPFiles/check_submission.php?stxAddress=${stxAddress}`);
    const result = await response.json();

    console.log(result)

    if (result.submitted) {
      setAlreadySubmitted(true);
      setErrorMessage("");
    }
  }

  async function checkAirdropEligibility(stxAddress: string) {
    try {
      let pass = false;
      const response = await fetch(`https://api.hiro.so/extended/v1/address/${stxAddress}/balances`);
      const data = await response.json();

      // Check fungible token requirement
      if (data.fungible_tokens && data.fungible_tokens["SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope::NOT"]) {
        const fungibleAmount = parseInt(data.fungible_tokens["SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope::NOT"].balance);
        if (fungibleAmount > 300000000) {
          pass = true;
        }
      }

      // Check non-fungible token requirement
      if (data.non_fungible_tokens && data.non_fungible_tokens["SP1C2K603TGWJGKPT2Z3WWHA0ARM66D352385TTWH.not-punk::NOT-Punk"]) {
        const nftCount = data.non_fungible_tokens["SP1C2K603TGWJGKPT2Z3WWHA0ARM66D352385TTWH.not-punk::NOT-Punk"].count;
        if (nftCount >= 1) {
          pass = true;
        }
      }

      // Set eligibility based on requirements
      if (pass) {
        setEligibleForAirdrop(true);
        setSuccessMessage('You are eligible for the Pizza Pets airdrop, because you hold at least 300,000,000 NOT tokens or 1 NOT-Punk NFT.')
      } else {
        setErrorMessage("You do not meet the requirements for the airdrop. Ensure you hold at least 300,000,000 NOT tokens or 1 NOT-Punk NFT.");
        setEligibleForAirdrop(false);
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Error checking eligibility. Please try again.");
    }
  }

  const handleSubmit = async () => {

    if (isSubmitting) { return; }
    setIsSubmitting(true);

    setShowModal(true);
    setModalMessage("Submitting...");

    if (!btcAddress || !discordID || !discordHandle) {
      setErrorMessage("Please fill in all required fields.");
      setIsSubmitting(false);
      setShowModal(false);
      return;
    }

    const submission = {
      stacksAddress: userPrincipal,
      btcAddress,
      discordID,
      discordHandle,
    };

    try {
      const response = await fetch('https://nscribed.it/PHPFiles/save_submission.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      const result = await response.json();

      if (result.error) {
        setModalMessage(result.error);
      } else {
        setModalMessage("Submission successful!");
        setSuccessMessage("Submission successful!");
        setErrorMessage("");
        setEligibleForAirdrop(false); // hide fields after submission
        setBtcAddress('');
        setDiscordID('');
        setDiscordHandle('');
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Error submitting data. Please try again.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { setShowModal(false) }, 3000);
    }
  };

  return (
    <div className="container">
      <div className="connect-wrapper">
        {authenticated ? (
          <div className="connect-wrapper">
            <div className="connect-button" onClick={authenticate}>{userPrincipal.slice(0, 6)}...{userPrincipal.slice(-4)}</div>
          </div>
        ) : (
          <div className="connect-button" onClick={authenticate}>Connect</div>
        )}
      </div>

      <div className="title-text">NOT x PIZZA PETS AIRDROP</div>

      {authenticated && !alreadySubmitted && (
        <div className="form-container">
          {eligibleForAirdrop ? (
            <>
              <p className="success-message">{successMessage}</p>
              <div className="input-group">
                <input type="text" className="input-field" value={btcAddress} onChange={(e) => setBtcAddress(e.target.value)} placeholder="BTC Ordinals Address (bc1p...)" />
                <input type="text" className="input-field" value={discordID} onChange={(e) => setDiscordID(e.target.value)} placeholder="Discord ID" />
                <input type="text" className="input-field" value={discordHandle} onChange={(e) => setDiscordHandle(e.target.value)} placeholder="Discord Handle" />
                <div onClick={handleSubmit} className="submit-button">SUBMIT FOR AIRDROP</div>
              </div>
            </>
          ) : (
            <p className="error-message">{errorMessage}</p>
          )}
        </div>
      )}
      {alreadySubmitted && <p className="submitted-message">Your address has already been submitted.</p>}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>{modalMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;