#!/bin/bash
# Quick script to check server logs
ssh -i ~/Downloads/korakagaz-backend-key.pem ubuntu@server.korakagazindia.com 'pm2 logs korakagaz-backend --lines 50 --nostream'

