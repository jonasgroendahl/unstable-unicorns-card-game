import { Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import { GAME_THEME_OPTIONS, isGameThemeId } from "#/lib/gameTheme.ts";
import { useGameTheme } from "./GameThemeProvider.tsx";

export function GameThemeSelect() {
  const { themeId, setThemeId } = useGameTheme();

  return (
    <div className="game-theme-select">
      <span id="game-theme-label">
        <Palette aria-hidden="true" />
        Theme
      </span>
      <Select
        value={themeId}
        onValueChange={(value) => {
          if (isGameThemeId(value)) setThemeId(value);
        }}
      >
        <SelectTrigger size="sm" aria-labelledby="game-theme-label">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectGroup>
            <SelectLabel>Choose a theme</SelectLabel>
            {GAME_THEME_OPTIONS.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
