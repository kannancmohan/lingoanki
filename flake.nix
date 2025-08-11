{
  description = "LingoAnki - A language learning flashcard application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and npm
            nodejs_20
            nodePackages.npm
            
            # Development tools
            git
          ];

          shellHook = ''
            echo "🚀 LingoAnki development environment loaded!"
            echo "Available commands:"
            echo "  npm run dev     - Start development server"
            echo "  npm run build   - Build for production"
            echo "  npm run preview - Preview production build"
            echo ""
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
          '';

          # Environment variables
          NODE_ENV = "development";
        };

        # Development shell with additional tools
        devShells.full = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and npm
            nodejs_20
            nodePackages.npm
            
            # Development tools
            git
            
            # Code quality tools (optional - not configured in project)
            nodePackages.typescript
            
            # Useful development tools
            ripgrep
            fd
            jq
          ];

          shellHook = ''
            echo "🔧 LingoAnki full development environment loaded!"
            echo "Available commands:"
            echo "  npm run dev     - Start development server"
            echo "  npm run build   - Build for production"
            echo "  npm run preview - Preview production build"
            echo ""
            echo "Additional tools available:"
            echo "  rg (ripgrep)    - Fast text search"
            echo "  fd              - Fast file search"
            echo "  jq              - JSON processor"
            echo "  tsc             - TypeScript compiler"
            echo ""
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
          '';

          NODE_ENV = "development";
        };

        # Packages for building
        packages = {
          default = pkgs.stdenv.mkDerivation {
            pname = "lingo-anki";
            version = "1.0.0";
            
            src = ./.;
            
            nativeBuildInputs = with pkgs; [
              nodejs_20
              nodePackages.npm
            ];
            
            buildPhase = ''
              npm ci
              npm run build
            '';
            
            installPhase = ''
              mkdir -p $out
              cp -r dist/* $out/
            '';
            
            meta = with pkgs.lib; {
              description = "A language learning flashcard application";
              homepage = "https://github.com/yourusername/lingoanki";
              license = licenses.mit;
              platforms = platforms.all;
            };
          };
        };
      }
    );
}
