import React from "react";
import FontDownloader from "./components/FontDownloader.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Google Font Downloader
        </h1>
        <p className="mt-2 text-gray-300">Enter Google Font names to fetch the .ttf files.</p>
      </header>
      <main className="w-full max-w-3xl">
        <FontDownloader />
      </main>
      <footer className="mt-12 text-sm text-gray-400 text-center">
        Fonts are fetched from the official google/fonts GitHub repository. Licenses
        belong to their respective authors.
      </footer>
    </div>
  );
}
