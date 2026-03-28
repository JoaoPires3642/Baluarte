"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Team } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <Link href={`/time/${team.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary transition-all duration-300 group-hover:scale-105 group-hover:border-primary">
            {!logoError ? (
              <Image
                src={team.logo}
                alt={`Escudo ${team.name}`}
                fill
                sizes="80px"
                className="object-contain p-2"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-3xl font-black text-foreground">{team.name.charAt(0)}</span>
            )}
          </div>
          <h3 className="mt-4 text-center text-sm font-medium text-foreground">
            {team.name}
          </h3>
          {team.league && (
            <p className="mt-1 text-xs text-muted-foreground">{team.league}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
