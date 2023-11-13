let ws;

chrome.runtime.onMessage.addListener(({ txid, confirmations }) => {
  checkConfirmations(txid, confirmations);
});

function checkConfirmations(txid, confirmations) {
  fetch(`https://api.blockcypher.com/v1/btc/main/txs/${txid}`)
    .then((data) => data.json())
    .then((data) => {
      if (data.confirmations >= confirmations) {
        sendMessageNotification(data.confirmations);
      } else {
        createWs(txid, confirmations);
      }
    });
}

function createWs(txid, confirmations) {
  if (ws?.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(
    `wss://socket.blockcypher.com/v1/btc/main?token=0a05df34698542dbba64d037419d3a5b`
  );

  ws.onmessage = (event) => {
    const tx = JSON.parse(event.data);
    sendMessageNotification(tx.confirmations);
    ws.close();
  };
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        event: "tx-confirmation",
        confirmations: Number(confirmations),
        hash: txid,
      })
    );
  };
  ws.onerror = (error) => {
    console.error("Error connection WebSocket:", error);
  };

  ws.onclose = (event) => {
    console.log("Connection WebSocket closed:", event.code, event.reason);
  };
}

function sendMessageNotification(confimations) {
  const options = {
    body: `Confirmations : ${confimations}`,
  };
  self.registration.showNotification("BTC TX SUCESSFULLY", options);
}
