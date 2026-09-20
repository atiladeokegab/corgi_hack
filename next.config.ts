import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is a symlink to CLAUDE.md in this repo, so Next's generated agent
  // rules would be appended straight into the case brief. Off.
  agentRules: false,
};

export default nextConfig;
