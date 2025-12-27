"use client";
import { createContext, useState, useEffect, useCallback, useMemo } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize auth state from storage
  const initializeAuth = useCallback(() => {
    // Don't reinitialize if already initialized
    if (isInitialized) {
      return;
    }
    
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const storedUser = localStorage.getItem("user");
      const adminToken = localStorage.getItem("adminToken");
      const userToken = localStorage.getItem("token");

      if (adminToken) {
        // Admin authentication takes precedence
        setAuthState({
          user: storedUser ? JSON.parse(storedUser) : { isAdmin: true },
          isAuthenticated: true,
          isAdmin: true,
          loading: false
        });
        setIsInitialized(true);
      } else if (userToken) {
        // Regular user authentication - fetch complete student data
        const userData = storedUser ? JSON.parse(storedUser) : null;
        if (userData) {
          // Fetch complete student data from API
          fetchCompleteStudentData(userData._id || userData.id);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            loading: false
          });
          setIsInitialized(true);
        }
      } else {
        // No authentication found
        setAuthState({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: false
        });
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Clear invalid auth data
      localStorage.removeItem("user");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      setAuthState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false
      });
      setIsInitialized(true);
    }
  }, []);

  // Fetch complete student data from API
  const fetchCompleteStudentData = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/students/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const completeUserData = await response.json();
        // Update localStorage with complete data
        localStorage.setItem("user", JSON.stringify(completeUserData));
        setAuthState({
          user: completeUserData,
          isAuthenticated: true,
          isAdmin: false,
          loading: false
        });
        setIsInitialized(true);
      } else {
        // Fallback to stored data if API fails
        const storedUser = localStorage.getItem("user");
        const userData = storedUser ? JSON.parse(storedUser) : null;
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isAdmin: false,
          loading: false
        });
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      // Fallback to stored data
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isAdmin: false,
        loading: false
      });
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback((userData, isAdminLogin = false, token = null) => {
    try {
      if (isAdminLogin) {
        if (!token) throw new Error("Admin token is required");
        localStorage.setItem("adminToken", token);
        localStorage.removeItem("token"); // Clear regular user token if exists
      } else {
        if (!userData) throw new Error("User data is required");
        localStorage.setItem("user", JSON.stringify(userData));
        if (token) localStorage.setItem("token", token);
        localStorage.removeItem("adminToken"); // Clear admin token if exists
      }

      const newAuthState = {
        user: userData || { isAdmin: true },
        isAuthenticated: true,
        isAdmin: isAdminLogin,
        loading: false
      };
      
      setAuthState(newAuthState);
      setIsInitialized(true);
      setRefreshKey(prev => prev + 1);
      
      // Force immediate re-render
      setTimeout(() => {
        setAuthState(prev => ({ ...prev }));
        // Dispatch custom event for navbar
        window.dispatchEvent(new CustomEvent('authStateChanged'));
      }, 0);
    } catch (error) {
      console.error("Login error:", error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("onlineCourseUser")
    localStorage.removeItem("onlineCourseUserToken")
    localStorage.removeItem("nextauth.message")
    localStorage.removeItem("adminData")
    
    const newAuthState = {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false
    };
    
    // Reset all state to ensure proper re-render
    setAuthState(newAuthState);
    setIsInitialized(false);
    setRefreshKey(prev => prev + 1);
    
    // Force immediate re-render
    setTimeout(() => {
      setAuthState(prev => ({ ...prev }));
      // Dispatch custom event for navbar
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }, 0);
  }, []);

  // Check fee status and course completion
  const checkFeeStatus = useCallback(() => {
    if (!authState.user || authState.isAdmin) return null;

    const today = new Date();
    const user = authState.user;

    // Check if course is completed
    if (user.farewellDate && today > new Date(user.farewellDate)) {
      return {
        type: 'courseCompleted',
        data: {
          farewellDate: user.farewellDate,
          courseName: user.selectedCourse || 'Course'
        }
      };
    }

    // If no fee details exist, block access and require fee setup
    if (!user.feeDetails || !user.feeDetails.installmentDetails || user.feeDetails.installmentDetails.length === 0) {
      return {
        type: 'noFeeSetup',
        data: {
          message: 'Your fee structure has not been set up yet. Please contact the fees manager to set up your payment plan before accessing exams.'
        }
      };
    }

    // Find overdue installments
    const overdueInstallments = user.feeDetails.installmentDetails
      .filter(installment => {
        const dueDate = new Date(installment.submissionDate);
        return !installment.paid && today > dueDate;
      })
      .sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));

    if (overdueInstallments.length > 0) {
      return {
        type: 'overdueInstallment',
        data: {
          installment: overdueInstallments[0],
          totalOverdue: overdueInstallments.length,
          totalAmount: overdueInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0)
        }
      };
    }

    // Check for upcoming installments (within 7 days) - but don't block access
    const upcomingInstallments = user.feeDetails.installmentDetails
      .filter(installment => {
        const dueDate = new Date(installment.submissionDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return !installment.paid && daysUntilDue <= 7 && daysUntilDue >= 0;
      })
      .sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));

    if (upcomingInstallments.length > 0) {
      return {
        type: 'upcomingInstallment',
        data: {
          installment: upcomingInstallments[0],
          daysUntilDue: Math.ceil((new Date(upcomingInstallments[0].submissionDate) - today) / (1000 * 60 * 60 * 24))
        }
      };
    }

    return null; // All good
  }, [authState.user, authState.isAdmin]);

  const contextValue = useMemo(() => ({
    ...authState,
    login, 
    logout,
    initializeAuth,
    checkFeeStatus,
    fetchCompleteStudentData,
    refreshKey
  }), [authState, login, logout, initializeAuth, checkFeeStatus, fetchCompleteStudentData, refreshKey]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}