# Cinefilum — Netflix-style Movie & TV Recommender

A React + Vite starter implementing personalized movie discovery and synchronized Watch Together rooms with the Cinefilum brand identity.

## Included
- Cinematic responsive dark UI
- Home, Movies, TV Shows, Genres, Search, Details, My List
- Continue Watching
- Profile, Settings, Onboarding
- Explainable recommendation scores
- Watch Together room prototype with synchronized-state UI and chat
- Responsive mobile navigation
- Sample movie data
- Client-side routing

## Run
```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Production next steps
1. Replace sample poster/backdrop URLs with licensed/authorized API data.
2. Move API keys to a server-side backend.
3. Add authentication and PostgreSQL/MongoDB persistence.
4. Implement a real recommendation service using content-based + collaborative signals.
5. Add WebSocket/Socket.IO synchronization for Watch Together.
6. Integrate only authorized streaming/content providers; do not bypass DRM or redistribute copyrighted video.
