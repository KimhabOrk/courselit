import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Button, ImageListItemBar } from "@mui/material";
import {
  USERS_MANAGER_PAGE_HEADING,
  LOAD_MORE_TEXT,
  HEADER_EDITING_USER,
} from "../../../ui-config/strings";
import FetchBuilder from "../../../ui-lib/fetch";
import { connect } from "react-redux";
import { networkAction } from "../../../state/actions";
import { OverviewAndDetail } from "@courselit/components-library";
import dynamic from "next/dynamic";
import Auth from "../../../ui-models/auth";
import Address from "../../../ui-models/address";
import { AppDispatch } from "../../../state/store";
import Profile from "../../../ui-models/profile";
import { ThunkDispatch } from "redux-thunk";
import State from "../../../ui-models/state";
import { AnyAction } from "redux";
import User from "../../../ui-models/user";

const PREFIX = "index";

const classes = {
  btn: `${PREFIX}-btn`,
};

const StyledOverviewAndDetail = styled(OverviewAndDetail)(() => ({
  [`& .${classes.btn}`]: {
    width: "100%",
    height: "100%",
  },
}));

const Img = dynamic(() => import("../../Img"));
const Details = dynamic(() => import("./Details"));

interface UserManagerProps {
  auth: Auth;
  address: Address;
  dispatch: AppDispatch;
  profile: Profile;
}

const UsersManager = ({
  auth,
  address,
  dispatch,
  profile,
}: UserManagerProps) => {
  const [usersPaginationOffset, setUsersPaginationOffset] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [componentsMap, setComponentsMap] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, [usersPaginationOffset]);

  const loadUsers = async () => {
    const query = `
    query {
      users: getSiteUsers(searchData: {
        offset: ${usersPaginationOffset}
      }) {
        id,
        name,
        userId,
        email
      }
    }
    `;
    const fetch = new FetchBuilder()
      .setUrl(`${address.backend}/api/graph`)
      .setPayload(query)
      .setIsGraphQLEndpoint(true)
      .build();
    try {
      (dispatch as ThunkDispatch<State, null, AnyAction>)(networkAction(true));
      const response = await fetch.exec();
      if (response.users && response.users.length > 0) {
        setUsers([...users, ...response.users]);
        setUsersPaginationOffset(usersPaginationOffset + 1);
      }
    } catch (err) {
    } finally {
      (dispatch as ThunkDispatch<State, null, AnyAction>)(networkAction(false));
    }
  };

  useEffect(() => {
    const map = [];
    users.map((user) => {
      map.push(getComponent(user));
    });
    map.push({
      Overview: (
        <Button variant="outlined" className={classes.btn} onClick={loadUsers}>
          {LOAD_MORE_TEXT}
        </Button>
      ),
    });
    setComponentsMap(map);
  }, [usersPaginationOffset]);

  const getComponent = (user: User) => ({
    subtitle: HEADER_EDITING_USER,
    Overview: (
      <>
        <Img src={""} isThumbnail={true} />
        <ImageListItemBar
          title={`${user.name ? user.name : user.email}${
            profile.email === user.email ? " (You)" : ""
          }`}
        />
      </>
    ),
    Detail: <Details userId={user.userId} />,
  });

  return (
    <OverviewAndDetail
      title={USERS_MANAGER_PAGE_HEADING}
      componentsMap={componentsMap}
    />
  );
};

const mapStateToProps = (state: State) => ({
  auth: state.auth,
  address: state.address,
  profile: state.profile,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  dispatch: dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(UsersManager);