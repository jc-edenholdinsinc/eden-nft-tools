const collectionList = document.getElementById('collection-list');
window.userAddress = null;
window.onload = async () => {
    // Init Web3 connected to ETH network
    if (!window.ethereum) {
        alert("No ETH brower extension detected.");
    }

    // Load in Localstore key
    window.userAddress = window.localStorage.getItem("userAddress");
    showAddress();
};

// Use this function to turn a 42 character ETH address
// into an address like 0x345...12345
function truncateAddress(address) {
    if (!address) {
        return "";
    }
    return `${address.substr(0, 5)}...${address.substr(
        address.length - 5,
        address.length
    )}`;
}

// Display or remove the users know address on the frontend
function showAddress() {
    if (!window.userAddress) {
        document.getElementById("wallet-connect").innerText = "Connect Wallet";
        document.getElementById("logoutButton").classList.add("hidden");
        return false;
    }

    document.getElementById("wallet-connect").innerText = `${truncateAddress(window.userAddress)}`;
    document.getElementById("logoutButton").classList.remove("hidden");

    getOpenseaItems();
}

// remove stored user address and reset frontend
function logout() {
    window.userAddress = null;
    window.localStorage.removeItem("userAddress");
    window.localStorage.removeItem("isLoggedIn");

    const collectionList = document.getElementById('collection-list')
    collectionList.innerHTML = "";
    showAddress();
}

// Login with Web3 via Metamasks window.ethereum library
async function loginWithEth() {    
    if (window.ethereum) {
        try {
            // We use this since ethereum.enable() is deprecated. This method is not
            // available in Web3JS - so we call it directly from metamasks' library
            const selectedAccount = await window.ethereum
                .request({
                    method: "eth_requestAccounts",
                })
                .then((accounts) => accounts[0])
                .catch(() => {
                    throw Error("No account selected!");
                });
            window.userAddress = selectedAccount;
            window.localStorage.setItem("isLoggedIn", true);
            window.localStorage.setItem("userAddress", selectedAccount);
            showAddress();
        } catch (error) {
            console.error(error);
        }
    } else {
        alert("No ETH brower extension detected.");
    }
}

async function getOpenseaItems() {

    if (!window.userAddress) { return }

    const items = await fetch(
            `https://testnets-api.opensea.io/api/v1/assets?owner=${window.userAddress}&order_direction=desc&offset=0&limit=50`
            )
        .then((res) => res.json())
        .then((res) => {            
            nftCollection = [];    
            res.assets.forEach((nft) => {
                const { collection } = nft
                const collectionDetail = { "name": collection.name, "slug": collection.slug }
        
                nftCollection.push(collectionDetail)        
            });
                
            const uniqueCollections = Array.from(new Set(nftCollection.map(a => a.name))).map(name => { return nftCollection.find(a => a.name === name) })            
            const listHeader = document.createElement("thead");
            listHeader.innerHTML = `<thead>
                <tr>
                    <th scope="col">Collection</th>
                    <th scope="col">Current Floor Price</th>
                </tr>
            </thead>`
            collectionList.appendChild(listHeader);
            
            uniqueCollections.forEach((i) => {
                const nftDetails = fetch(`https://testnets-api.opensea.io/api/v1/collection/${i.slug}/stats`)
                    .then((res) => res.json())
                    .then((res) => { 
                        const listElement = document.createElement("tbody")
                        listElement.innerHTML = `<tr><td>${i.name}</td><td>${res.stats.floor_price}</td></tr>`
                        collectionList.appendChild(listElement);
                    })
                    .catch((e) => {
                        console.error(e)                        
                        alert('Could not fetch data from OpenSea. Please refresh this page.');
                        return null
                    })  

            })
            return res.assets
        })
        .catch((e) => {
            console.error(e)
            alert('Could not fetch data from OpenSea. Please refresh this page.');
            return null
        })

    if (items.length === 0) return
}