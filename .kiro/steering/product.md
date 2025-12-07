# Product Overview

This is a hotel shuttle bus booking system for Ibis Jakarta Airport hotels (Ibis Style and Ibis Budget). The application provides a streamlined booking flow for guests to reserve seats on airport shuttle buses.

## Core Features

- **Real-time shuttle booking** with live capacity tracking
- **Hotel selection** between Ibis Style and Ibis Budget Jakarta Airport
- **Schedule selection** with visual capacity indicators (available/almost-full/full)
- **WhatsApp ticket delivery** using Wablas API integration
- **Booking tracking** via unique booking codes
- **Admin dashboard** for managing bookings, schedules, and monitoring system health

## User Flow

1. Select hotel (Ibis Style or Ibis Budget)
2. Choose departure schedule with real-time capacity
3. Enter passenger details (name, phone, passenger count, room number)
4. Receive booking code and WhatsApp ticket
5. Track booking status via tracking page

## Business Rules

- Shuttles operate 06:00 - 22:00 WIB daily
- Bookings close 20 minutes before departure
- Maximum 5 passengers per booking
- Free service for hotel guests
- Booking codes follow format: `IBX...`
