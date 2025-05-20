
# Open source Kahoot alternative

This is an open source Kahoot alternative, a game-based learning platform that brings engagement and fun at school, work, and at home.
This project aims to provide similar functionality to Kahoot while being customizable and extensible for various educational and entertainment purposes.


1. The host starts the game
1. Players join the game
1. The host starts the questions
1. Players answer the questions
1. Results are shown


##  Built With
* [Nextjs](https://nextjs.org/)
* [Supabase](https://supabase.com/)
* [Tailwind CSS](https://tailwindcss.com/)

TODOs:
[x] Fragen bei allen gleichzeitig per Klick anzeigen
[x] Fragen nacheinander per Klick anzeigen
[ ] Leaderboard der ersten 3 oder 4 zwischen jeder Frage


## Run Locally
```sh
# Install dependencies 
npm ci

# Start Supabase
npm run supabase:start

# Start Next.js locally
npm run dev

# Build application
npm run build

# Serve on network (make sure to turn off the firewall and the network should be marked as private on windows)
npm run start:network

# Access app in your web browser at `http://localhost:3000`. 

```

## weird supabase port blocking docker bug in windows 

```
// bug:
bind: An attempt was made to access a socket in a way forbidden by its access permissions.

// solution in powershell with admin rights:
net stop winnat
netsh int ipv4 add excludedportrange protocol=tcp startport=54321 numberofports=5
net start winnat
```

Access the project root at / to join as a player.

Access /host to join as a host.

## Generate Types

`supabase gen types typescript --local --schema public > src/types/supabase.ts`

[read more on generating types](https://supabase.com/docs/guides/api/rest/generating-types)


## Contributing

We welcome contributions from the community! If you'd like to contribute, please follow these guidelines:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

## License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)

