#!/bin/sh

yarn db:migration:up:prod
yarn start:prod
