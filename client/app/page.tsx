import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  AppBar,
  Toolbar,
  Card,
  CardContent,
} from "@mui/material";
import {
  AutoAwesome as AiIcon,
  Dashboard as DashboardIcon,
  BarChart as AnalyticsIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "AI-Powered Creation",
    description:
      "Describe your form in plain English. Our AI understands your needs and builds a professional form in seconds.",
    icon: <AiIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
  {
    title: "Intuitive Builder",
    description:
      "Fine-tune every detail with our real-time drag-and-drop builder. Add questions, logic, and styles with ease.",
    icon: <DashboardIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
  {
    title: "Smart Analytics",
    description:
      "Go beyond raw data. Get automated summaries, beautiful charts, and actionable insights from every response.",
    icon: <AnalyticsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
  {
    title: "Secure & Private",
    description:
      "Your data is safe with us. Advanced access control, secure sharing, and enterprise-grade privacy come standard.",
    icon: <SecurityIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
];

export default function LandingPage() {
  return (
    <Box className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Link href="/" className="flex items-center gap-2 no-underline">
              <Image
                src="/form_ai_icon.svg"
                alt="FormIA Logo"
                width={32}
                height={32}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  letterSpacing: "-0.5px",
                }}
              >
                FormIA
              </Typography>
            </Link>

            <Stack
              direction="row"
              spacing={{ xs: 2, md: 4 }}
              sx={{ alignItems: "center" }}
            >
              <Link
                href="#features"
                className="hidden md:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors no-underline"
              >
                Features
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors no-underline"
              >
                Login
              </Link>
              <Link href="/register" className="no-underline">
                <Button
                  variant="contained"
                  size="small"
                  sx={{ px: { xs: 2, md: 3 }, py: 1, borderRadius: "50px" }}
                >
                  Get Started
                </Button>
              </Link>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 15 },
          pb: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background element */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "40%",
            height: "60%",
            background:
              "radial-gradient(circle, rgba(1, 65, 255, 0.05) 0%, rgba(255,255,255,0) 70%)",
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: 4,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mb: 3,
                  background:
                    "linear-gradient(45deg, #050505 30%, #0141ff 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Build Smarter Forms <br /> With AI
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{
                  mb: 5,
                  fontWeight: 400,
                  maxWidth: "600px",
                  lineHeight: 1.6,
                }}
              >
                Describe your form in plain English and let our AI handle the
                rest. No complex builders, no frustration—just professional
                forms in seconds.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Link href="/register" className="no-underline">
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      width: "100%",
                    }}
                  >
                    Start Building for Free
                  </Button>
                </Link>
                <Link href="#features" className="no-underline">
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      width: "100%",
                    }}
                  >
                    See Features
                  </Button>
                </Link>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, width: "100%" }}>
              <Box
                sx={{
                  position: "relative",
                  p: 2,
                  bgcolor: "white",
                  borderRadius: 4,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Image
                  src="/form_ai_icon.svg"
                  alt="Hero Illustration"
                  width={400}
                  height={400}
                  priority
                  style={{ width: "100%", height: "auto" }}
                />
                {/* Floating element for visual interest */}
                <Box
                  className="animate-bounce"
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    p: 2,
                    bgcolor: "primary.main",
                    borderRadius: 2,
                    color: "white",
                    boxShadow: "0 10px 20px rgba(1, 65, 255, 0.2)",
                  }}
                >
                  <AiIcon />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 12, bgcolor: "#fcfcfc" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="overline"
              color="primary"
              sx={{ fontWeight: 700, letterSpacing: 2 }}
            >
              FEATURES
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: 800,
                mt: 1,
              }}
            >
              Everything you need to <br /> collect data efficiently
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: 4,
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  height: "100%",
                  p: 2,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-8px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 15 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              p: { xs: 6, md: 10 },
              bgcolor: "primary.main",
              borderRadius: 8,
              textAlign: "center",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background pattern */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.1,
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            <Typography
              variant="h3"
              sx={{ fontWeight: 800, mb: 3, position: "relative" }}
            >
              Ready to build your first AI form?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 5,
                opacity: 0.9,
                fontWeight: 400,
                position: "relative",
              }}
            >
              Join thousands of teams using FormIA to streamline their data
              collection.
            </Typography>
            <Link href="/register" className="no-underline">
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 6,
                  py: 2,
                  bgcolor: "white",
                  color: "primary.main",
                  borderRadius: "50px",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  position: "relative",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                Get Started for Free
              </Button>
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 8, borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <Box sx={{ maxWidth: "300px" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Image
                  src="/form_ai_icon.svg"
                  alt="FormIA Logo"
                  width={24}
                  height={24}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}
                >
                  FormIA
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                The next generation of form builders, powered by artificial
                intelligence.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: { xs: 8, md: 12 } }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Product
                </Typography>
                <Stack spacing={1}>
                  <Link
                    href="#features"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    Features
                  </Link>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    Templates
                  </Link>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    Pricing
                  </Link>
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Company
                </Typography>
                <Stack spacing={1}>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    About
                  </Link>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    Blog
                  </Link>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-blue-600 no-underline"
                  >
                    Careers
                  </Link>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 8,
              pt: 4,
              borderTop: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} FormIA. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
