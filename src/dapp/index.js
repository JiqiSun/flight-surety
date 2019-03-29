import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    let timestamp = Math.floor(Date.now() / 1000)
    let status = null

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        contract.flightStatus(result => {
            console.log(result.status)
            status = result.status
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, timestamp, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight} ]);
            });
        })

        DOM.elid('submit-fund').addEventListener('click', () => {
            let amount = DOM.elid('fund-amount').value
            contract.airlineFund(amount, (error, result) => {
              display(`Airline ${result.address}`, 'Provide Funding', [{
                label: 'Funding',
                error: error,
                value: `${result.amount} ETH` }])
            })
          })

          DOM.elid('buy-insureance').addEventListener('click', () => {
            let amount = DOM.elid('insureance-amount').value
            let flightNumber = DOM.elid('flight-number').value
            contract.insuranceFlight(flightNumber, timestamp, amount, (error, result) => {
              display(`${result.message}`, 'Provide Funding', [{
                label: 'Funding',
                error: error,
                value: `${result.amount} ETH` }])
            })
          })
          
          DOM.elid('claim-insureance').addEventListener('click', () => {
            contract.claimInsurance((error, result) => {
                display(`balance`, 'Provide Funding', [{
                    label: 'Funding',
                    error: error,
                    value: `${result} ETH` }])
                })
          })  

          DOM.elid('get-status').addEventListener('click', () => {
            display(`Flight status`, 'current status',[{
                label: 'status code',
                value:status
            }])
          })

          DOM.elid('submit-withdraw').addEventListener('click', () => {
            contract.withdrawFunds()
          })
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
