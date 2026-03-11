import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";

module {
  type OldCategory = {
    #groceries;
    #rent;
    #schoolFees;
    #utilities;
    #travel;
    #entertainment;
    #other;
  };

  type OldExpense = {
    id : Nat;
    description : Text;
    amount : Nat;
    category : OldCategory;
    paidBy : Text;
    splitAmong : [Text];
    date : Text;
  };

  type OldSettlement = {
    from : Text;
    to : Text;
    amount : Nat;
    note : ?Text;
    timestamp : Int;
  };

  type OldUserProfile = {
    name : Text;
    email : Text;
  };

  type OldActor = {
    expenses : Map.Map<Nat, OldExpense>;
    settlements : List.List<OldSettlement>;
    members : Map.Map<Text, Int>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    nextExpenseId : Nat;
  };

  type NewCategory = {
    #groceries;
    #rent;
    #schoolFees;
    #utilities;
    #travel;
    #entertainment;
    #other;
  };

  type SplitType = {
    #equal;
    #percentage;
    #custom;
  };

  type NewMember = {
    id : Text;
    name : Text;
    phone : Text;
  };

  type NewExpense = {
    id : Nat;
    description : Text;
    amount : Nat;
    category : NewCategory;
    date : Time.Time;
    paidBy : Text;
    splitType : SplitType;
    splitDetails : [(Text, Nat)];
  };

  type NewActor = {
    expenses : Map.Map<Nat, NewExpense>;
    settlements : List.List<OldSettlement>;
    members : Map.Map<Text, NewMember>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextExpenseId : Nat;
  };

  func migrateDate(date : Text) : Time.Time {
    switch (Nat.fromText(date)) {
      case (?timestamp) { timestamp : Time.Time };
      case (null) { 0 };
    };
  };

  public func run(old : OldActor) : NewActor {
    let newExpenses = old.expenses.map<Nat, OldExpense, NewExpense>(
      func(_id, oldExpense) {
        {
          oldExpense with
          date = migrateDate(oldExpense.date);
          splitType = #equal;
          splitDetails = [];
        };
      }
    );

    let newMembers = old.members.map<Text, Int, NewMember>(
      func(id, _balance) {
        { id; name = id; phone = "" };
      }
    );

    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, { name : Text }>(
      func(_principal, oldProfile) { { name = oldProfile.name } }
    );

    {
      old with
      expenses = newExpenses;
      members = newMembers;
      userProfiles = newUserProfiles;
    };
  };
};
