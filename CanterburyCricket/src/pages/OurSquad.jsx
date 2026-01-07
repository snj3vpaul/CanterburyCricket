import React, { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

const fallbackAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="#0b1220"/>
    <circle cx="300" cy="245" r="110" fill="#1f2a44"/>
    <rect x="130" y="375" width="340" height="170" rx="85" fill="#1f2a44"/>
  </svg>
`);

const ROLE_OPTIONS = ["All", "Batter", "Bowler", "All-rounder", "Wicket-keeper"];
const DIV_OPTIONS = ["All", "T20", "CTZ", "CHG"];

const SQUAD = [
  {
    id: "p1",
    name: "Ameer Khan",
    role: "Batter",
    division: "T20",
    battingStyle: "Right-hand",
    bowlingStyle: "—",
    playingStyle: ["Aggressive Opener", "Power-hitter"],
    bio: "Explosive top-order batter. Loves taking on the powerplay and setting the tone early.",
    strengths: ["Powerplay striker", "Boundary-hitting", "Fast starter"],
    image: fallbackAvatar,
  },
  {
    id: "p2",
    name: "Varun Singh",
    role: "All-rounder",
    division: "CTZ",
    battingStyle: "Right-hand",
    bowlingStyle: "Medium",
    playingStyle: ["Utility", "Clutch"],
    bio: "Balanced all-rounder — contributes with both bat and ball and thrives in pressure moments.",
    strengths: ["Middle overs control", "Finishing cameos", "Smart match-ups"],
    image: fallbackAvatar,
  },
  {
    id: "p3",
    name: "Akram Syed",
    role: "Bowler",
    division: "CHG",
    battingStyle: "Right-hand",
    bowlingStyle: "Leg-spin",
    playingStyle: ["Wicket-taker", "Clever variations"],
    bio: "Leg-spinner who hunts wickets and uses flight/turn to break partnerships.",
    strengths: ["Wicket-taking", "Deception", "Middle overs breakthroughs"],
    image: fallbackAvatar,
  },
  {
    id: "p4",
    name: "Aoun Ali",
    role: "Wicket-keeper",
    division: "T20",
    battingStyle: "Left-hand",
    bowlingStyle: "—",
    playingStyle: ["Safe hands", "Anchor"],
    bio: "Calm keeper-batter who stabilizes the innings and keeps things tidy behind the stumps.",
    strengths: ["Reliable glovework", "Rotation of strike", "Game awareness"],
    image: fallbackAvatar,
  },
];

function normalize(value) {
  return (value || "").toString().trim().toLowerCase();
}

export default function OurSquad() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [division, setDivision] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = normalize(query);

    return SQUAD.filter((p) => {
      const matchesRole = role === "All" ? true : p.role === role;
      const matchesDivision = division === "All" ? true : p.division === division;

      if (!matchesRole || !matchesDivision) return false;

      if (!q) return true;

      const haystack = normalize(
        [
          p.name,
          p.role,
          p.division,
          p.battingStyle,
          p.bowlingStyle,
          ...(p.playingStyle || []),
          ...(p.strengths || []),
        ].join(" ")
      );

      return haystack.includes(q);
    });
  }, [query, role, division]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617 0%, #070b18 40%, #0b1220 100%)",
      }}
    >
      <Container size="lg" py={40}>
        {/* Header */}
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={6}>
            <Title order={1} style={{ color: "#f8fafc" }}>
              Our Squad
            </Title>
            <Text c="dimmed" maw={720}>
              Meet the Canterbury Cricket Club lineup — players, roles, and playing styles.
            </Text>
          </Stack>

          <Group gap="sm" wrap="wrap">
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Search: name, role, style…"
              w={260}
            />
            <Button
              variant="light"
              onClick={() => {
                setQuery("");
                setRole("All");
                setDivision("All");
              }}
            >
              Reset
            </Button>
          </Group>
        </Group>

        {/* Filters + Results */}
        <Grid mt="lg" gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="lg" p="md">
              <Stack gap="sm">
                <Text fw={700}>Filters</Text>

                <Select
                  label="Division"
                  data={DIV_OPTIONS}
                  value={division}
                  onChange={(v) => setDivision(v || "All")}
                />

                <Select
                  label="Role"
                  data={ROLE_OPTIONS}
                  value={role}
                  onChange={(v) => setRole(v || "All")}
                />

                <Divider />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Results
                  </Text>
                  <Badge variant="light">{filtered.length}</Badge>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {filtered.map((p) => (
                <Card key={p.id} withBorder radius="lg" p="md" h="100%">
                  <Group align="flex-start" wrap="nowrap">
                    <Avatar src={p.image} size={64} radius="lg" />
                    <Stack gap={6} style={{ flex: 1 }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div style={{ minWidth: 0 }}>
                          <Text fw={800} lineClamp={1}>
                            {p.name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {p.role} • {p.division}
                          </Text>
                        </div>

                        <Button size="xs" onClick={() => setSelected(p)}>
                          View
                        </Button>
                      </Group>

                      <Group gap={6} wrap="wrap">
                        {(p.playingStyle || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </Group>

                      <Group gap="xs" wrap="wrap" mt={2}>
                        <Badge variant="light">Bat: {p.battingStyle}</Badge>
                        <Badge variant="light">Bowl: {p.bowlingStyle}</Badge>
                      </Group>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>

            {filtered.length === 0 && (
              <Card withBorder radius="lg" p="lg" mt="md">
                <Text fw={700}>No players match your filters.</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Try changing the division/role or clearing the search box.
                </Text>
              </Card>
            )}
          </Grid.Col>
        </Grid>

        {/* Player modal */}
        <Modal
          opened={!!selected}
          onClose={() => setSelected(null)}
          centered
          radius="lg"
          size="lg"
          title={
            selected ? (
              <Group gap="xs" wrap="wrap">
                <Text fw={800}>{selected.name}</Text>
                <Badge variant="light">{selected.division}</Badge>
                <Badge variant="outline">{selected.role}</Badge>
              </Group>
            ) : null
          }
        >
          {selected && (
            <Stack>
              <Group align="flex-start" wrap="nowrap">
                <Avatar src={selected.image} size={96} radius="xl" />
                <Stack gap={8} style={{ flex: 1 }}>
                  <Group gap={6} wrap="wrap">
                    {(selected.playingStyle || []).map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </Group>

                  <Text size="sm" c="dimmed">
                    Batting: <b>{selected.battingStyle}</b> • Bowling:{" "}
                    <b>{selected.bowlingStyle}</b>
                  </Text>
                </Stack>
              </Group>

              <Text>{selected.bio}</Text>

              <Divider />

              <div>
                <Text fw={800} mb={6}>
                  Strengths
                </Text>
                <Stack gap={4}>
                  {(selected.strengths || []).map((s) => (
                    <Text key={s} size="sm">
                      • {s}
                    </Text>
                  ))}
                </Stack>
              </div>
            </Stack>
          )}
        </Modal>
      </Container>
    </div>
  );
}
