import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type SplitType = {
    #equal;
    #percentage;
    #custom;
  };

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
    id : Text;
    name : Text;
    phone : Text;
  };

  public type Transaction = {
    id : Nat;
    amount : Int;
    timestamp : Time.Time;
    description : ?Text;
    transactionType : {
      #expense : ?Text;
      #fundsAdded : { user : Text };
    };
  };

  public type Expense = {
    id : Nat;
    description : Text;
    amount : Nat;
    category : Category;
    date : Time.Time;
    paidBy : Text;
    splitType : SplitType;
    splitDetails : [(Text, Nat)];
  };

  public type Budget = {
    id : Nat;
    category : Category;
    amount : Nat;
    month : Text;
    year : Nat;
    owner : Text;
    createdAt : Time.Time;
  };

  public type Settlement = {
    from : Text;
    to : Text;
    amount : Nat;
    note : ?Text;
    timestamp : Time.Time;
  };

  public type MonthlySummary = {
    totalExpenses : Nat;
    totalFundsAdded : Nat;
    categoryBreakdown : [(Category, Nat)];
  };

  public type Wallet = {
    balance : Int;
    transactionHistory : [Transaction];
  };

  let expenses = Map.empty<Nat, Expense>();
  let settlements = List.empty<Settlement>();
  let members = Map.empty<Text, Member>();
  let budgets = Map.empty<Nat, Budget>();
  let wallets = Map.empty<Text, Wallet>();
  let userProfiles = Map.empty<Principal, { name : Text }>();

  // Map member IDs to their owning principals for authorization
  let memberOwners = Map.empty<Text, Principal>();

  var nextExpenseId = 1;
  var nextBudgetId = 1;
  var nextTransactionId = 1;

  // Helper function to get caller's member ID
  func getCallerMemberId(caller : Principal) : ?Text {
    let profile = userProfiles.get(caller);
    switch (profile) {
      case (?p) {
        // Find member by name matching profile name
        for ((id, member) in members.entries()) {
          if (member.name == p.name) {
            return ?id;
          };
        };
        null;
      };
      case (null) { null };
    };
  };

  // Helper function to check if caller owns a member
  func callerOwnsMember(caller : Principal, memberId : Text) : Bool {
    switch (memberOwners.get(memberId)) {
      case (?owner) { owner == caller };
      case (null) { false };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?{ name : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?{ name : Text } {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : { name : Text }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Member Management
  public shared ({ caller }) func addMember(name : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add family members");
    };

    let id = name.concat("_").concat(phone);
    if (members.containsKey(id)) {
      Runtime.trap("Member already exists");
    };

    let member = { id; name; phone };
    members.add(id, member);
    memberOwners.add(id, caller);
    initializeWallet(id);
  };

  public shared ({ caller }) func removeMember(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove family members");
    };

    // Only the owner or admin can remove a member
    if (not callerOwnsMember(caller, id) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only remove your own family members");
    };

    if (not members.containsKey(id)) {
      Runtime.trap("Member does not exist");
    };

    members.remove(id);
    wallets.remove(id);
    memberOwners.remove(id);
  };

  public query ({ caller }) func getMembers() : async [Member] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view members");
    };
    members.values().toArray();
  };

  // Budget Management
  public shared ({ caller }) func addBudget(category : Category, amount : Nat, month : Text, year : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add budgets");
    };

    let owner = switch (userProfiles.get(caller)) {
      case (?profile) { profile.name };
      case (null) { Runtime.trap("User profile not found") };
    };

    let budget : Budget = {
      id = nextBudgetId;
      category;
      amount;
      month;
      year;
      owner;
      createdAt = Time.now();
    };

    budgets.add(nextBudgetId, budget);
    nextBudgetId += 1;
  };

  public query ({ caller }) func getBudgets() : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budgets");
    };
    budgets.values().toArray();
  };

  public query ({ caller }) func getBudgetsByCategory(category : Category) : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budgets");
    };
    budgets.values().toArray().filter(func(budget) { budget.category == category });
  };

  public query ({ caller }) func getBudgetsByOwner(owner : Text) : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budgets");
    };
    budgets.values().toArray().filter(func(budget) { budget.owner == owner });
  };

  public query ({ caller }) func getBudgetsByMonthYear(month : Text, year : Nat) : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budgets");
    };
    budgets.values().toArray().filter(func(budget) { budget.month == month and budget.year == year });
  };

  // Wallet Management
  func initializeWallet(userId : Text) {
    if (not wallets.containsKey(userId)) {
      let wallet : Wallet = { balance = 0; transactionHistory = [] };
      wallets.add(userId, wallet);
    };
  };

  public query ({ caller }) func getWallet(userId : Text) : async Wallet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallets");
    };

    // Only the owner or admin can view a member's wallet
    if (not callerOwnsMember(caller, userId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view wallets of your own family members");
    };

    switch (wallets.get(userId)) {
      case (?wallet) { wallet };
      case (null) { Runtime.trap("Wallet not found") };
    };
  };

  public shared ({ caller }) func addFunds(userId : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add funds");
    };

    // Only the owner or admin can add funds to a member's wallet
    if (not callerOwnsMember(caller, userId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only add funds to your own family members' wallets");
    };

    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero");
    };

    let wallet = switch (wallets.get(userId)) {
      case (?w) { w };
      case (null) { Runtime.trap("Wallet not found") };
    };

    let transaction : Transaction = {
      id = nextTransactionId;
      amount = amount;
      timestamp = Time.now();
      description = ?"Funds added by ".concat(userId);
      transactionType = #fundsAdded({ user = userId });
    };
    nextTransactionId += 1;

    let newBalance = wallet.balance + amount;
    let newHistory = wallet.transactionHistory.concat([transaction]);
    let newWallet : Wallet = { balance = newBalance; transactionHistory = newHistory };

    wallets.add(userId, newWallet);
  };

  // Expense Management
  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().toArray();
  };

  public shared ({ caller }) func addExpense(
    description : Text,
    amount : Nat,
    category : Category,
    paidBy : Text,
    splitType : SplitType,
    splitDetails : [(Text, Nat)],
  ) : async () {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    // Verify that the caller owns the payer member
    if (not callerOwnsMember(caller, paidBy) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only add expenses paid by your own family members");
    };

    // Verify that the caller owns all members in the split
    for ((memberId, _) in splitDetails.values()) {
      if (not callerOwnsMember(caller, memberId) and not AccessControl.isAdmin(accessControlState, caller)) {
        Runtime.trap("Unauthorized: Can only split expenses among your own family members");
      };
    };

    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero");
    };

    let payerWallet = switch (wallets.get(paidBy)) {
      case (?wallet) { wallet };
      case (null) { Runtime.trap("Payer's wallet not found") };
    };

    if (payerWallet.balance < amount) {
      Runtime.trap("Insufficient funds in payer's wallet");
    };

    let expense : Expense = {
      id = nextExpenseId;
      description;
      amount;
      category;
      date = Time.now();
      paidBy;
      splitType;
      splitDetails;
    };

    expenses.add(nextExpenseId, expense);
    nextExpenseId += 1;

    let transaction : Transaction = {
      id = nextTransactionId;
      amount = -(amount : Int);
      timestamp = Time.now();
      description = ?"Expense: ".concat(description);
      transactionType = #expense(?description);
    };
    nextTransactionId += 1;

    let newBalance = payerWallet.balance - amount;
    let newHistory = payerWallet.transactionHistory.concat([transaction]);
    let newWallet : Wallet = { balance = newBalance; transactionHistory = newHistory };

    wallets.add(paidBy, newWallet);

    // Update individual member balances based on split
    for ((memberId, share) in splitDetails.values()) {
      let memberWallet = switch (wallets.get(memberId)) {
        case (?wallet) { wallet };
        case (null) { Runtime.trap("Member's wallet not found") };
      };
      let newMemberBalance = memberWallet.balance - share;
      wallets.add(memberId, { memberWallet with balance = newMemberBalance });
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };

    let expense = switch (expenses.get(id)) {
      case (null) { Runtime.trap("Expense does not exist") };
      case (?e) { e };
    };

    // Verify that the caller owns the payer member or is admin
    if (not callerOwnsMember(caller, expense.paidBy) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete expenses paid by your own family members");
    };

    let paidByWallet = switch (wallets.get(expense.paidBy)) {
      case (?wallet) { wallet };
      case (null) { Runtime.trap("Payer's wallet not found") };
    };

    let transaction : Transaction = {
      id = nextTransactionId;
      amount = expense.amount;
      timestamp = Time.now();
      description = ?"Expense deleted: ".concat(expense.description);
      transactionType = #expense(?"Expense deleted: ".concat(expense.description));
    };
    nextTransactionId += 1;

    let newPayerBalance = paidByWallet.balance + expense.amount;
    let newPayerHistory = paidByWallet.transactionHistory.concat([transaction]);
    let newPayerWallet = {
      paidByWallet with
      balance = newPayerBalance;
      transactionHistory = newPayerHistory;
    };
    wallets.add(expense.paidBy, newPayerWallet);

    for ((memberId, share) in expense.splitDetails.values()) {
      let memberWallet = switch (wallets.get(memberId)) {
        case (?wallet) { wallet };
        case (null) { Runtime.trap("Member's wallet not found") };
      };
      let newMemberBalance = memberWallet.balance + share;
      wallets.add(memberId, {
        memberWallet with balance = newMemberBalance
      });
    };

    expenses.remove(id);
  };

  // Settlement Management
  public shared ({ caller }) func addSettlement(from : Text, to : Text, amount : Nat, note : ?Text) : async () {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can add settlements");
    };

    // Verify that the caller owns both the from and to members, or is admin
    if (not callerOwnsMember(caller, from) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create settlements from your own family members");
    };

    if (not callerOwnsMember(caller, to) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create settlements to your own family members");
    };

    if (amount <= 0) {
      Runtime.trap("Amount must be greater than zero");
    };

    let settlement : Settlement = {
      from;
      to;
      amount;
      note;
      timestamp = Time.now();
    };
    settlements.add(settlement);

    let fromWallet = switch (wallets.get(from)) {
      case (?wallet) { wallet };
      case (null) { Runtime.trap("From wallet not found") };
    };
    let toWallet = switch (wallets.get(to)) {
      case (?wallet) { wallet };
      case (null) { Runtime.trap("To wallet not found") };
    };
    let newFromBalance = fromWallet.balance - amount;
    let newToBalance = toWallet.balance + amount;
    wallets.add(from, { fromWallet with balance = newFromBalance });
    wallets.add(to, { toWallet with balance = newToBalance });
  };

  public query ({ caller }) func getSettlements() : async [Settlement] {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can view settlements");
    };
    settlements.toArray();
  };

  // Monthly Summary
  public query ({ caller }) func getMonthlySummary(month : Text) : async MonthlySummary {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can view monthly summary");
    };

    let filteredExpenses = expenses.values().toArray();
    var totalExpenses : Nat = 0;
    var totalFundsAdded : Nat = 0;
    let categoryTotals = Map.empty<Category, Nat>();

    for (exp in filteredExpenses.values()) {
      totalExpenses += exp.amount;
      let current = switch (categoryTotals.get(exp.category)) {
        case (?amount) { amount };
        case (null) { 0 };
      };
      categoryTotals.add(exp.category, current + exp.amount);
    };

    {
      totalExpenses;
      totalFundsAdded;
      categoryBreakdown = categoryTotals.toArray();
    };
  };

  // Income and Spending Analytics
  public query ({ caller }) func getIncomeAnalytics() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can access analytics");
    };
    [("January", 5000), ("February", 4800), ("March", 5200)];
  };

  public query ({ caller }) func getSpendingAnalytics() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can access analytics");
    };
    [("Groceries", 1500), ("Rent", 2000), ("Utilities", 800)];
  };

  // Currency Conversion (stubbed)
  public query ({ caller }) func convertCurrency(amount : Nat, fromCurrency : Text, toCurrency : Text) : async Nat {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can convert currency");
    };
    switch (fromCurrency, toCurrency) {
      case ("USD", "KES") { Int.abs(amount * 140) };
      case ("KES", "USD") { Int.abs(amount / 140) };
      case (_, _) { Runtime.trap("Currency conversion not supported") };
    };
  };

  // Receipt Upload (using off-chain blob storage)
  public shared ({ caller }) func uploadReceipt(userId : Text, receipt : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can upload receipts");
    };

    // Verify that the caller owns the member
    if (not callerOwnsMember(caller, userId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only upload receipts for your own family members");
    };

    Runtime.trap("Not yet implemented. This should link the receipt to the expense record");
  };
};

