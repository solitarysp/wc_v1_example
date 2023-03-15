import {useEffect, useState} from 'react'
import './App.css'
import WalletConnect from "@walletconnect/client";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

const CHAIN_ID_RELEASE = "finschia-1";
const CHAIN_ID_BETA = "finschia-beta-1";

let client = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org',
    clientMeta: {
        name: "dApp example",
        description: "Just another dApp",
        url: "https://dapp.example/com",
        icons: ["https://i.pinimg.com/600x315/93/3e/14/933e14abb0241584fd6d5a31bea1ce7b.jpg"],
    },
});

function App() {
    const [chainId, setChainId] = useState(CHAIN_ID_RELEASE);
    const [connect, setConnect] = useState(false);
    const [sessionUri, setSessionUri] = useState(null);
    const [address, setAddress] = useState(null);
    const [msgToSign, setMsgToSign] = useState('Any text');
    const [signature, setSignature] = useState(null);

    useEffect(() => {
        console.log('like componentDidMount()');
        // componentDidMount()
        client.on("connect", async (error, payload) => {
            if (error) {
                setSessionUri(null);
                throw error;
            }

            WalletConnectQRCodeModal.close();
            setConnect(true);
            // no useful information in 'payload' since WalletConnect v1 is only for EVM-compatible chains
            // https://github.com/chainapsis/keplr-wallet/blob/master/packages/mobile/src/stores/wallet-connect/index.ts#L42
            console.log('on "connect"', payload, client.connected);
            const addrFromVault = await fetchAddress();
            setAddress(addrFromVault);
        });

        client.on("disconnect", (error, payload) => {
            console.log('on "disconnect"');
            setSessionUri(null);
            setAddress(null);
            window.location.reload()
        });

        (async () => {
            // create a session on page load
            if (client.connected) {
                await client.killSession();
            }

            await client.createSession();
            setSessionUri(client.uri);
        })();
        return () => {    // clean up (componetWillUnmount)
            console.log('like componentWillUnmount()');
            client.off("connect");
            client.off("disconnect");
        };
    }, [chainId]);

    async function showQRCodeModal() {
        if (connect) {
            const addrFromVault = await fetchAddress();
            setAddress(addrFromVault);
        } else {
            console.log('connectWallet() clientid', client.clientId);
            WalletConnectQRCodeModal.open(client.uri);
        }
    }

    function getDynamicLinkUrlRelease(wcUrl) {
        if (!!wcUrl) {
            const encodedUrl = encodeURIComponent(wcUrl);
            return `https://dosivault.page.link/qL6j?uri_wc=${encodedUrl}`;
        } else {
            return `https://dosivault.page.link/qL6j`;
        }
    }

    function changeChainIdToRelease() {
        setChainId(CHAIN_ID_RELEASE);
    }

    function changeChainIdToBeta() {
        setChainId(CHAIN_ID_BETA);
    }

    function getDynamicLinkUrlBeta(wcUrl) {
        if (!!wcUrl) {
            const encodedUrl = encodeURIComponent(wcUrl);
            return `https://dosivault.page.link/muUh?uri_wc=${encodedUrl}`;
        } else {
            return `https://dosivault.page.link/muUh`;
        }
    }

    function getDeepLinkUrl(wcUrl) {
        if (!!wcUrl) {
            const encodedUrl = encodeURIComponent(wcUrl);
            return `app.dosivault://wc?uri_wc=${encodedUrl}`;
        } else {
            return `app.dosivault://wc"`;
        }
    }

    async function fetchAddress() {
        console.log(chainId)
        // Keplr returns only an active address despite it's in a form of an array
        const accounts = await client.sendCustomRequest({
            id: Math.floor(Math.random() * 100000),
            method: "keplr_get_key_wallet_connect_v1",
            params: [chainId],
        });
        console.log('fetched account:', accounts[0]);
        return accounts[0].bech32Address;
    }

    async function handleSignArbitraryMsg() {
        const [resp] = await client.sendCustomRequest({
            id: Math.floor(Math.random() * 100000),
            method: "keplr_sign_free_message_wallet_connect_v1",
            params: [chainId, address, msgToSign],
        });
        setSignature(resp.signature);
    }

    return (
        <div className="App" style={{backgroundColor: client.session.key ? 'white' : 'grey'}}>
            <div>
                <img src="https://i.pinimg.com/600x315/93/3e/14/933e14abb0241584fd6d5a31bea1ce7b.jpg"></img>
            </div>
            <div hidden={!!address}>

            </div>
            <h1>dApp Example</h1>
            <h2>WalletConnect v1 + Vault</h2>
            <div>Session URI: {sessionUri}</div>

            <div className="card">
                <div hidden={!!address}>
                    ChainId: {chainId}
                    <div>
                        <button
                            hidden={chainId === CHAIN_ID_RELEASE}
                            onClick={changeChainIdToRelease}>
                            Change ChainId to release
                        </button>
                        <button
                            hidden={chainId === CHAIN_ID_BETA}
                            onClick={changeChainIdToBeta}>
                            Change ChainId to beta
                        </button>
                    </div>
                    <div>
                        <button onClick={showQRCodeModal}>
                            Connect (QR Modal)
                        </button>
                    </div>
                    <div>
                        <a href={getDynamicLinkUrlRelease(sessionUri)}>Dynamic link Release</a>
                    </div>
                    <div>
                        <a href={getDynamicLinkUrlBeta(sessionUri)}>Dynamic link beta</a>
                    </div>
                    <div>
                        <a href={getDeepLinkUrl(sessionUri)}>Deep link</a>
                    </div>
                </div>
                <div hidden={!address}>
                    Address: {address}

                    <div style={{borderBlock: "1px dotted"}}>
                        Message to sign :
                        <input value={msgToSign} onChange={e => setMsgToSign(e.target.value)}/>
                        <button onClick={handleSignArbitraryMsg}>
                            Off-chain sign
                        </button>
                        <a href={getDynamicLinkUrlRelease()}>
                            Bring Vault to front
                        </a>
                        <div>
                            Signature: <p>{signature}</p>
                        </div>
                    </div>
                </div>
            </div>
            <footer>
                <h3>
                    <a href='https://github.com/dosivault/wc_v1_example'>Source code</a>
                </h3>
                <button onClick={() => {
                    client.killSession()
                }}>Kill Session Manually (only for Debugging)
                </button>
            </footer>
        </div>
    )
}

export default App
