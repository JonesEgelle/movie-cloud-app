import React, { useEffect, useState } from "react";
import Search from "./components/search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import { Query } from "appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY} `,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [debounceSearchTerm, setDebounceSearchTerm] = useState("");

  //Debounce the seaarch term to prevent making too many API requests
  // By waiting for the user to stop typing for 500ms before updating the debounced search term
  useDebounce(() => setDebounceSearchTerm(searchTerm), 700, [searchTerm]);

  const fetchMovies = async (query = " ") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`Failed to fetch movies`);
      }
      const data = await response.json();

      if (data.response == "false") {
        setErrorMessage(data.error || "failed to fetch movies");
        setMovieList([]);
        return;
      }
      // TMDB returns results array
      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setErrorMessage(`Error fetching movies. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies : ${error}`);
    }
  };
  useEffect(() => {
    fetchMovies(debounceSearchTerm);
  }, [debounceSearchTerm]);
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img
            src="/movieTile.png"
            alt="Hero banner showing stylized film artwork and cinematic elements; complements the page heading Find Movies You'll Enjoy Without Hassle; welcoming and upbeat tone"
          />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without Hassle{" "}
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movies, index) => (
                <li key={movies.$id}>
                  <p> {index + 1} </p>
                  <img
                    src={movies.poster_url || "/noPoster2.png"}
                    alt={movies.title}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="all-movies">
          <h2 className="">All Movies</h2>

          {isLoading ? (
            <div className="flex justify-center items-center mt-10">
              <Spinner />
            </div>
          ) : errorMessage ? (
            <p className="text-red-500"> {errorMessage} </p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
