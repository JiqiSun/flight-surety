import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network]
        
        if (window.ethereum) {
            // use metamask's providers
            // modern browsers
            this.web3 = new Web3(window.ethereum)
            // Request accounts access
            try {
              window.ethereum.enable()
            } catch (error) {
              console.error('User denied access to accounts')
            }
          } else if (window.web3) {
            // legacy browsers
            this.web3 = new Web3(web3.currentProvider)
          } else {
            // fallback for non dapp browsers
            this.web3 = new Web3(new Web3.providers.HttpProvider(config.url))
        }

        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];
            console.log(accts)
            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, timestamp, callback) {
        let self = this;
        let payload = {
            airline: "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
            flight: flight,
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    airlineFund (amount, callback) {
        let self = this
        self.flightSuretyApp.methods
          .fund()
          .send({
            from: self.owner,
            value: self.web3.utils.toWei(amount, 'ether')
          }, (error, result) => {
            callback(error, { address: self.owner, amount: amount })
          })
    }

    insuranceFlight(flightNumber, timestamp, amount, callback) {
        let self = this
        self.flightSuretyApp.methods
          .registerFlight("0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2", flightNumber,timestamp)
          .send({
              from: self.owner,
              value: self.web3.utils.toWei(amount, 'ether')
          },(error,result) => { 
            callback(error, {message:"flight insurance bought", amount:amount})
          })   
    }

    claimInsurance(callback) {
        let self = this
        self.flightSuretyApp.methods
          .insureeBalance()
          .call({from:self.owner},(error,result) =>{
            callback(error, self.web3.utils.fromWei(result, "ether"))
          })
    }

    flightStatus(callback) {
        let self = this
        self.flightSuretyApp.events.FlightStatusInfo({}, function(error, events){
            if(error) {
                console.log(error)
            } else {
                callback(events.returnValues)
            }
        })
    }

    withdrawFunds(callback) {
        let self = this;
        self.flightSuretyApp.methods
          .withdraw()
          .send({from:self.owner}, (error, result) => {
              if(error) {
                  console.log(error)
              }
          })
    }
    
    



    
}