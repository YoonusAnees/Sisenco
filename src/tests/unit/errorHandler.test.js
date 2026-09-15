import { jest } from "@jest/globals";
import AppError from "../../utils/AppError.js";
import errorHandler from "../../middlewares/middleware.errorHandler.js";

describe("Global Error Handling Middleware Unit Tests", () => {
  it("formats AppError correctly with statusCode and message", () => {
    const error = new AppError("Invalid input parameters", 400);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Invalid input parameters",
      })
    );
  });
});
