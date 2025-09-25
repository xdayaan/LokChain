const VotingSystem = artifacts.require("VotingSystem");
const { expect } = require("chai");

contract("VotingSystem", (accounts) => {
  let votingSystem;
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];

  before(async () => {
    votingSystem = await VotingSystem.deployed();
  });

  describe("Poll Creation", () => {
    it("should create a new poll", async () => {
      const title = "Test Poll";
      const description = "This is a test poll";
      const options = ["Option 1", "Option 2", "Option 3"];
      const duration = 3600; // 1 hour

      const result = await votingSystem.createPoll(
        title,
        description,
        options,
        duration,
        { from: owner }
      );

      expect(result.logs[0].event).to.equal("PollCreated");
      expect(result.logs[0].args.pollId.toString()).to.equal("1");
    });

    it("should not allow non-owner to create poll", async () => {
      try {
        await votingSystem.createPoll(
          "Unauthorized Poll",
          "Description",
          ["Option 1", "Option 2"],
          3600,
          { from: voter1 }
        );
        assert.fail("Expected revert");
      } catch (error) {
        expect(error.message).to.include("caller is not the owner");
      }
    });
  });

  describe("Voter Registration", () => {
    it("should register a voter", async () => {
      const result = await votingSystem.registerVoter(voter1, { from: owner });
      expect(result.logs[0].event).to.equal("VoterRegistered");
    });

    it("should not register same voter twice", async () => {
      try {
        await votingSystem.registerVoter(voter1, { from: owner });
        assert.fail("Expected revert");
      } catch (error) {
        expect(error.message).to.include("Voter already registered");
      }
    });
  });

  describe("Voting", () => {
    before(async () => {
      await votingSystem.registerVoter(voter2, { from: owner });
    });

    it("should allow registered voter to vote", async () => {
      const pollId = 1;
      const encryptedVote = "encrypted_vote_data";
      const voteHash = "vote_hash";

      const result = await votingSystem.castVote(
        pollId,
        encryptedVote,
        voteHash,
        { from: voter1 }
      );

      expect(result.logs[0].event).to.equal("VoteCast");
    });

    it("should not allow double voting", async () => {
      try {
        await votingSystem.castVote(
          1,
          "encrypted_vote_data",
          "vote_hash",
          { from: voter1 }
        );
        assert.fail("Expected revert");
      } catch (error) {
        expect(error.message).to.include("Already voted in this poll");
      }
    });

    it("should not allow unregistered voter to vote", async () => {
      try {
        await votingSystem.castVote(
          1,
          "encrypted_vote_data",
          "vote_hash",
          { from: accounts[3] }
        );
        assert.fail("Expected revert");
      } catch (error) {
        expect(error.message).to.include("Voter not registered");
      }
    });
  });
});