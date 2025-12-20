import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import matchesRoutes from './routes/matches.routes';
import insightsRoutes from './routes/insights.routes';
import healthRoutes from './routes/health.routes';
import userStatsRoutes from './routes/user-stats.routes';
import staticRoutes from './routes/static.routes';
import leaguesRoutes from './routes/leagues.routes';
import teamRoutes from './routes/team.routes';
import favoriteLeagueRoutes from './routes/favorite-league.routes';
import couponRoutes from './routes/coupon.routes';
import syncRoutes from './routes/sync.routes';

const app = express();

// CORS - Allow all origins (fully public)
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'AI Football Prediction API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/me', userRoutes);
app.use('/me/favorite-leagues', favoriteLeagueRoutes);
app.use('/matches', matchesRoutes);
app.use('/insights', insightsRoutes);
app.use('/stats', userStatsRoutes);
app.use('/static', staticRoutes);
app.use('/leagues', leaguesRoutes);
app.use('/teams', teamRoutes);
app.use('/coupons', couponRoutes);
app.use('/sync', syncRoutes);

// Alias routes for API compatibility
app.use('/user/profile', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
