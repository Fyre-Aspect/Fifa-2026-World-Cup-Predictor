# FIFA World Cup 2026 Predictor

So basically this thing was made before the world cup started as a tool for me to make predictions on coming group stage games nad stuff and i was like let me share this compoilation of many models to predict the world cup and i share it to hack club. This is all open source right so in the future during like UEFA champions league or premier and stuff I will just change up and get predictions on that too and make it perfect. 

## Why I made it
As i mentioned earlier I wanted to have accurate predictions based on players performance in the last year in their respective clubs and weighed that into their national team using ELo right adn how that worked is basically helped me understand where realistically statistically where each team lands and currently Argentina is my team adn at the top which was previously before the world cup at 10th place. So this is really good after the beautiful messi hat trick they clinbed and this tool is projecting to see a rematch of 2022 world cup.

## How it works

The predictions come from a small model that, for each match, produces a
probability of a home win, draw, or away win, plus an expected number of goals
for each side. It basically uses these aspects:

- **Team strength** — an Elo rating built from the last few years of results.
- **Recent form** — each team's last handful of matches, weighted toward the
  most recent.
- **Betting markets** — implied odds from Polymarket and from bookmakers, with
  the built-in margin stripped out.

So after each prediction it is updated real time using an API with the actual scores after the game affectign both the bracket, groupstage and each indivdual team elo. 

## Built with

React, TypeScript and Vite for the app, Tailwind for styling, three.js for the
3D pieces, and Zustand for state. Data is validated with Zod whcih was assisted with claude research. THe backend is just basic and running on vite easily. 

## Where AI helped

No lie first I didnt want to upload this to hackatime adn hack club horizon but i was like its a cool project adn I struggled with dev server a lot during the end and i might as well share it so a major portion is technically AI. However eveyrhting liek the visuals and 3D files and idea of getting that there was mine and I had AI basically just refine the models and do the hard logistics aspects. 
