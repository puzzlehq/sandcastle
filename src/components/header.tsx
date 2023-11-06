import Network from "./network.tsx";
import { HStack } from "./ui/stacks.tsx";
import { ThemeToggle } from "./ui/theme-toggle.tsx";

const Header = () => {
  return (
    <div className="border-b">
      <HStack className="flex h-16 items-center justify-between px-4">
        <HStack>
          <p>Sandcastle</p>
        </HStack>
        <HStack>
          <Network />
          <ThemeToggle />
        </HStack>
      </HStack>
    </div>
  );
}

export { Header };