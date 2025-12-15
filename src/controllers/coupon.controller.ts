import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/coupon.service';

export class CouponController {
  /**
   * GET /coupons - Get all user coupons
   */
  async getCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const coupons = await couponService.getCoupons(userId);
      res.status(200).json({ coupons });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /coupons/active - Get active coupon
   */
  async getActiveCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const coupon = await couponService.getActiveCoupon(userId);
      res.status(200).json({ coupon });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /coupons/past - Get past coupons
   */
  async getPastCoupons(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const coupons = await couponService.getPastCoupons(userId);
      res.status(200).json({ coupons });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /coupons/:id - Get coupon by ID
   */
  async getCouponById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const coupon = await couponService.getCouponById(userId, id);
      res.status(200).json({ coupon });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /coupons - Create a new coupon
   */
  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      const coupon = await couponService.createCoupon(userId, { name });
      res.status(201).json({ coupon });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /coupons/:id - Delete a coupon
   */
  async deleteCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await couponService.deleteCoupon(userId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /coupons/:id/selections - Add a selection to coupon
   */
  async addSelection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const coupon = await couponService.addSelection(userId, id, req.body);
      res.status(201).json({ coupon });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /coupons/:id/selections/:selectionId - Remove selection from coupon
   */
  async removeSelection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id, selectionId } = req.params;
      const coupon = await couponService.removeSelection(userId, id, selectionId);
      res.status(200).json({ coupon });
    } catch (error) {
      next(error);
    }
  }
}

export const couponController = new CouponController();
