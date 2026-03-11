import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Category = {
    #groceries;
    #rent;
    #schoolFees;
    #utilities;
    #travel;
    #entertainment;
    #other;
  };

  module Category {
    public func compare(cat1 : Category, cat2 : Category) : Order.Order {
      switch (cat1, cat2) {
        case (#groceries, #groceries) { #equal };
        case (#groceries, _) { #less };
        case (_, #groceries) { #greater };
        case (#rent, #rent) { #equal };
        case (#rent, _) { #less };
        case (_, #rent) { #greater };
        case (#schoolFees, #schoolFees) { #equal };
        case (#schoolFees, _) { #less };
        case (_, #schoolFees) { #greater };
        case (#utilities, #utilities) { #equal };
        case (#utilities, _) { #less };
        case (_, #utilities) { #greater };
        case (#travel, #travel) { #equal };
        case (#travel, _) { #less };
        case (_, #travel) { #greater };
        case (#entertainment, #entertainment) { #equal };
        case (#entertainment, _) { #less };
        case (_, #entertainment) { #greater };
        case (#other, #other) { #equal };
      };
    };
  };

  public type Member = {
    name : Text;
    balance : Int;
  };

  public type Expense = {
    id : Nat;
    description : Text;
    amount : Nat;
    category : Category;
    paidBy : Text;
    splitAmong : [Text];
    date : Text;
  };

  public type Settlement = {
    from : Text;
    to : Text;
    amount : Nat;
    note : ?Text;
    timestamp : Time.Time;
  };

  public type MonthlySummary = {
    totalSpending : Nat;
    categoryBreakdown : [(Category, Nat)];
  };

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  let expenses = Map.empty<Nat, Expense>();
  let settlements = List.empty<Settlement>();
  let members = Map.empty<Text, Int>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextExpenseId = 0;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Member Management
  public shared ({ caller }) func addMember(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add members");
    };
    if (members.containsKey(name)) {
      Runtime.trap("Member already exists");
    };
    members.add(name, 0);
  };

  public shared ({ caller }) func removeMember(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove members");
    };
    if (not members.containsKey(name)) {
      Runtime.trap("Member does not exist");
    };
    members.remove(name);
  };

  public query ({ caller }) func getMembers() : async [Member] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view members");
    };
    members.toArray().map(func((name, balance)) { { name; balance } });
  };

  // Expense Management
  public shared ({ caller }) func addExpense(description : Text, amount : Nat, category : Category, paidBy : Text, splitAmong : [Text], date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero");
    };

    if (not members.containsKey(paidBy)) {
      Runtime.trap("Payer must be a member");
    };

    for (member in splitAmong.values()) {
      if (not members.containsKey(member)) {
        Runtime.trap("Split member must be a member");
      };
    };

    let expense = {
      id = nextExpenseId;
      description;
      amount;
      category;
      paidBy;
      splitAmong;
      date;
    };

    expenses.add(nextExpenseId, expense);
    nextExpenseId += 1;

    // Copy-update pattern for payers
    for ((name, bal) in members.entries()) {
      if (name == paidBy) {
        members.add(name, bal + amount);
      };
    };

    let individualShare = amount / splitAmong.size();
    for (member in splitAmong.values()) {
      switch (members.get(member)) {
        case (?bal) {
          members.add(member, bal - individualShare);
        };
        case (null) {};
      };
    };
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().toArray();
  };

  public query ({ caller }) func getExpense(id : Nat) : async ?Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.get(id);
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };
    let expense = switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense does not exist") };
      case (?e) { e };
    };

    // Copy-update pattern for payers
    for ((name, bal) in members.entries()) {
      if (name == expense.paidBy) {
        members.add(name, bal - expense.amount);
      };
    };

    let individualShare = expense.amount / expense.splitAmong.size();
    for (member in expense.splitAmong.values()) {
      switch (members.get(member)) {
        case (?bal) {
          members.add(member, bal + individualShare);
        };
        case (null) {};
      };
    };

    expenses.remove(id);
  };

  // Balance Calculation
  public query ({ caller }) func getBalances() : async [Member] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balances");
    };
    members.toArray().map(func((name, balance)) { { name; balance } });
  };

  // Settlement Management
  public shared ({ caller }) func addSettlement(from : Text, to : Text, amount : Nat, note : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add settlements");
    };
    if (amount <= 0) { Runtime.trap("Amount must be greater than zero") };

    if (not members.containsKey(from) or not members.containsKey(to)) {
      Runtime.trap("Both parties must be members");
    };

    let settlement : Settlement = {
      from;
      to;
      amount;
      note;
      timestamp = Time.now();
    };
    settlements.add(settlement);

    let fromBalance = switch (members.get(from)) {
      case (?bal) { bal - amount };
      case (null) { Runtime.trap("From member not found") };
    };
    let toBalance = switch (members.get(to)) {
      case (?bal) { bal + amount };
      case (null) { Runtime.trap("To member not found") };
    };
    members.add(from, fromBalance);
    members.add(to, toBalance);
  };

  public query ({ caller }) func getSettlements() : async [Settlement] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settlements");
    };
    settlements.toArray();
  };

  // Monthly Summary
  public query ({ caller }) func getMonthlySummary(month : Text) : async MonthlySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly summary");
    };
    let filteredExpenses = expenses.values().toArray().filter(func(exp) { exp.date.contains(#text month) });

    var total : Nat = 0;
    let categoryTotals = Map.empty<Category, Nat>();
    for (exp in filteredExpenses.values()) {
      total += exp.amount;
      let current = switch (categoryTotals.get(exp.category)) {
        case (?amount) { amount };
        case (null) { 0 };
      };
      categoryTotals.add(exp.category, current + exp.amount);
    };

    {
      totalSpending = total;
      categoryBreakdown = categoryTotals.toArray();
    };
  };
};
