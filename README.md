# Realtime Trading Server - JSRamverk Project

This is a microservice to provide realtime price updates for the [Frontend Platforms](https://github.com/EpiX0R/trading-platform).


## Realtime

The realtime aspect were created using and Express server together with socket.io.

The service has a connection to the MongoDB database and listens for connections to its socket. When a connection on the socket emits a "price update" message the service updates the price of the specified stock and emits a "price update" message to all connections. All the frontend applications/connections that recieve this message will then updates their graphs with the new values.

I believe socket.io to be a good way of implementing this type of realtime aspect to an application. Where the updates timings are unpredictable and user-based. It allows a user to recieve the latest data without requesting it and without any significant delay.


## Scheduled Closing Prices

The service also features a Cron Job which schedules all stocks daily closing price to be saved at 21:00.


## Installation

1. Clone this repository to a folder.

2. Inside the folder run `npm install`.


## Running the server

1. Inside your repository folder run `npm start`.
