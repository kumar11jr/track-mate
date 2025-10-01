# Track-Mate 🗺️

Track-Mate is a real-time trip planning and tracking application built with Next.js, allowing users to create trips, share locations, and coordinate with friends.

## Features 🌟

- **User Authentication** - Secure login and signup system
- **Real-time Location Tracking** - Track your current location with Google Maps integration
- **Trip Creation** - Create trips and invite up to 2 friends to join
- **Location Search** - Search for destinations with Google Places Autocomplete
- **Route Planning** - Get directions and estimated travel time to your destination
- **Multiple Travel Modes** - Support for driving, walking, cycling, and transit directions

## Tech Stack 💻

- **Frontend:**
  - Next.js 13+ (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Lucide Icons

- **Backend:**
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL Database

- **Authentication:**
  - NextAuth.js

- **Maps & Location:**
  - Google Maps JavaScript API
  - Google Places API
  - Google Directions API
  - Geolocation API

## Getting Started 🚀

### Prerequisites

- Node.js 16+
- PostgreSQL database
- Google Maps API key

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/kumar11jr/track-mate.git
cd track-mate
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
DATABASE_URL="your_postgresql_database_url"
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Required Google Maps APIs 🗺️

Enable the following APIs in your Google Cloud Console:
- Maps JavaScript API
- Places API
- Directions API
- Geocoding API

## Project Structure 📁

```
app/
├── (auth)/             # Authentication routes
├── (protected)/        # Protected routes
├── api/               # API routes
└── page.tsx           # Landing page
components/
├── ui/               # Reusable UI components
├── GoogleMapsDirections.tsx
├── AutoCompleteSearch.tsx
└── LogoutComponent.tsx
lib/
├── auth.ts           # Authentication utilities
├── prisma.ts         # Database client
└── google.ts         # Google Maps utilities
prisma/
└── schema.prisma     # Database schema
```

## Features in Development 🔄

- [ ] Real-time location sharing between trip participants
- [ ] Chat functionality for trip participants
- [ ] Trip history and statistics
- [ ] Multiple destination support
- [ ] Push notifications for trip updates

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments 🙏

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
